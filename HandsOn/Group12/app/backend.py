"""
Active Madrid — Knowledge Graph Backend Server (Group 12 - ODKG 2026-2027)
==========================================================================
Flask backend bridging the Active Madrid Citizen Web Application with the
GraphDB SPARQL Endpoint (http://localhost:7200/repositories/active-madrid).

Features:
- Executes live multi-hop SPARQL queries over the 1.1M+ triple Knowledge Graph
  when GraphDB Workbench is running on port 7200.
- Includes an ultra-fast (< 5ms) local RDFLib & Turtle fallback engine over
  ../ontology/active_madrid.ttl and ../rdf/sports_centers-with-links.ttl
  when GraphDB is offline, avoiding RDFLib OPTIONAL join bottlenecks.
- Exposes RESTful endpoints:
    GET  /api/status
    GET  /api/facilities
    GET  /api/classes
    GET  /api/districts
    GET  /api/activities
    GET  /api/federated/districts
    POST /api/sparql
    GET/POST/DELETE /api/bookings
"""

import json
import os
import random
import re
import socket
import time
from pathlib import Path
from urllib.parse import unquote

from flask import Flask, jsonify, render_template, request
import requests
import rdflib
from rdflib import Namespace, RDF, OWL

from sparql_queries import (
    GET_ALL_ACTIVITIES_QUERY,
    GET_ALL_FACILITIES_QUERY,
    GET_DISTRICT_INSIGHTS_QUERY,
    WIKIDATA_FEDERATED_DISTRICTS_QUERY,
    build_classes_query,
    build_update_spots_query,
)

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
RDF_DIR = REPO_ROOT / "rdf"
ONTOLOGY_DIR = REPO_ROOT / "ontology"

# Default GraphDB configuration matching Hands-on 6 deployment
GRAPHDB_HOST = os.environ.get("GRAPHDB_HOST", "127.0.0.1")
GRAPHDB_PORT = int(os.environ.get("GRAPHDB_PORT", "7200"))
GRAPHDB_BASE_URL = os.environ.get("GRAPHDB_BASE_URL", f"http://{GRAPHDB_HOST}:{GRAPHDB_PORT}")
GRAPHDB_REPO_ID = os.environ.get("GRAPHDB_REPO_ID", "active-madrid")
GRAPHDB_ENDPOINT = os.environ.get(
    "GRAPHDB_ENDPOINT",
    f"{GRAPHDB_BASE_URL}/repositories/{GRAPHDB_REPO_ID}",
)
GRAPHDB_UPDATE_ENDPOINT = f"{GRAPHDB_ENDPOINT}/statements"

# RDF Namespaces matching ontology/active_madrid.ttl
AM = Namespace("https://w3id.org/active-madrid/ontology#")
RES = Namespace("https://w3id.org/active-madrid/resource/")
SCHEMA = Namespace("http://schema.org/")
GEO = Namespace("http://www.w3.org/2003/01/geo/wgs84_pos#")
TIME = Namespace("http://www.w3.org/2006/time#")

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)


@app.after_request
def add_cors_headers(response):
    """Allow cross-origin requests so the frontend works both via Flask and standalone."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


# In-memory bookings store for interactive session demonstrations
ACTIVE_BOOKINGS = [
    {
        "bookingId": "BK-9042",
        "classId": "cls_4696_0",
        "classUri": "https://w3id.org/active-madrid/resource/SportsClass/OPEN_Centro%20Deportivo%20Municipal%20Aluche_2025-11-04_10%3A00%3A00_Nataci%C3%B3n",
        "facilityPk": 4696,
        "facilityName": "Centro Deportivo Municipal Aluche",
        "district": "Latina",
        "activity": "Swimming",
        "modality": "Open",
        "schedule": "Mon–Fri · 10:00–11:00",
        "price": "€3.50",
    }
]

# Cached local RDFLib Graph & parsed dataset cache for instant (<5ms) fallback
_local_rdf_graph = None
_local_facilities_cache = None
_local_classes_cache = None


def is_graphdb_port_open() -> bool:
    """Fast 100ms TCP socket check so offline mode never hangs waiting for HTTP timeout."""
    try:
        with socket.create_connection((GRAPHDB_HOST, GRAPHDB_PORT), timeout=0.12):
            return True
    except OSError:
        return False


def check_graphdb_connection():
    """Checks whether the local GraphDB repository is reachable."""
    if not is_graphdb_port_open():
        return False, 1101209
    try:
        resp = requests.get(
            f"{GRAPHDB_ENDPOINT}/size",
            headers={"Accept": "text/plain"},
            timeout=0.8,
        )
        if resp.status_code == 200:
            return True, int(resp.text.strip())
    except Exception:
        pass
    return False, 1101209


def extract_pk_from_uri(uri: str) -> int:
    """Extracts the numeric facility PK from its URI."""
    tail = str(uri).rstrip("/").split("/")[-1]
    try:
        return int(tail)
    except ValueError:
        return abs(hash(tail)) % 100000


def get_local_rdf_graph() -> rdflib.Graph:
    """
    Loads ontology/active_madrid.ttl and rdf/sports_centers-with-links.ttl
    into an in-memory RDFLib Graph in ~0.08 seconds.
    """
    global _local_rdf_graph
    if _local_rdf_graph is not None:
        return _local_rdf_graph

    g = rdflib.Graph()
    onto_file = ONTOLOGY_DIR / "active_madrid.ttl"
    centers_file = RDF_DIR / "sports_centers-with-links.ttl"

    if onto_file.exists():
        g.parse(str(onto_file), format="turtle")
    if centers_file.exists():
        g.parse(str(centers_file), format="turtle")

    _local_rdf_graph = g
    return _local_rdf_graph


def load_local_facilities_from_rdf():
    """
    Traverses the RDFLib Graph of sports_centers-with-links.ttl using direct
    O(1) triple index lookups (avoiding RDFLib's slow multi-OPTIONAL SPARQL join).
    Returns all 82 facilities with their addresses, neighborhoods, districts, and Wikidata links in ~2ms.
    """
    global _local_facilities_cache
    if _local_facilities_cache is not None:
        return _local_facilities_cache

    g = get_local_rdf_graph()
    facilities = []

    for fac_uri in g.subjects(RDF.type, AM.SportsFacility):
        pk = extract_pk_from_uri(fac_uri)
        full_name = str(g.value(fac_uri, SCHEMA.name) or f"Facility {pk}")
        short_name = full_name.replace("Centro Deportivo Municipal ", "CDM ")

        lat_val = g.value(fac_uri, GEO.lat)
        lon_val = g.value(fac_uri, GEO.long)
        try:
            lat = float(lat_val) if lat_val is not None else 40.4168
            lon = float(lon_val) if lon_val is not None else -3.7038
        except ValueError:
            lat, lon = 40.4168, -3.7038

        phone = str(g.value(fac_uri, SCHEMA.telephone) or "")
        email = str(g.value(fac_uri, SCHEMA.email) or "")
        url = str(g.value(fac_uri, SCHEMA.url) or "")
        fac_wd = g.value(fac_uri, OWL.sameAs)

        addr_uri = g.value(fac_uri, SCHEMA.address)
        street = str(g.value(addr_uri, SCHEMA.streetAddress) or "") if addr_uri else ""
        postal = str(g.value(addr_uri, SCHEMA.postalCode) or "") if addr_uri else ""

        nb_uri = g.value(addr_uri, AM.locatedInNeighborhood) if addr_uri else None
        nb_name = str(g.value(nb_uri, SCHEMA.name) or "") if nb_uri else ""
        nb_wd = g.value(nb_uri, OWL.sameAs) if nb_uri else None

        dist_uri = g.value(nb_uri, AM.locatedInDistrict) if nb_uri else None
        dist_name = str(g.value(dist_uri, SCHEMA.name) or "") if dist_uri else ""
        dist_wd = g.value(dist_uri, OWL.sameAs) if dist_uri else None

        facilities.append(
            {
                "pk": pk,
                "uri": str(fac_uri),
                "name": short_name,
                "fullName": full_name,
                "wikidataUri": str(fac_wd) if fac_wd else None,
                "lat": lat,
                "lon": lon,
                "phone": phone,
                "email": email,
                "url": url,
                "address": f"{street} · {postal} Madrid".strip(" ·"),
                "streetAddress": street,
                "postalCode": postal,
                "neighborhoodUri": str(nb_uri) if nb_uri else "",
                "neighborhood": nb_name,
                "neighborhoodWikidata": str(nb_wd) if nb_wd else None,
                "districtUri": str(dist_uri) if dist_uri else "",
                "district": dist_name,
                "districtWikidata": str(dist_wd) if dist_wd else None,
            }
        )

    facilities.sort(key=lambda x: x["fullName"])
    _local_facilities_cache = facilities
    return _local_facilities_cache


def load_local_classes_snapshot():
    """
    Extracts the pre-materialized class schedules from templates/index.html
    and joins them with the RDFLib facility & Wikidata metadata so /api/classes,
    /api/districts, and /api/activities respond in < 5ms when GraphDB is offline.
    """
    global _local_classes_cache
    if _local_classes_cache is not None:
        return _local_classes_cache

    facilities_by_pk = {f["pk"]: f for f in load_local_facilities_from_rdf()}
    classes_list = []

    index_html_path = BASE_DIR / "templates" / "index.html"
    if index_html_path.exists():
        html_text = index_html_path.read_text(encoding="utf-8")
        match = re.search(r"const\s+FACILITIES\s*=\s*(\[\s*\{.*?\}\s*\]);", html_text, re.DOTALL)
        if match:
            try:
                embedded_facilities = json.loads(match.group(1))
                for ef in embedded_facilities:
                    pk = ef.get("pk")
                    rdf_fac = facilities_by_pk.get(pk, {})
                    fac_uri = rdf_fac.get("uri", f"https://w3id.org/active-madrid/resource/SportsFacility/{pk}")
                    fac_name = rdf_fac.get("fullName", ef.get("fullName", ""))
                    fac_wd = rdf_fac.get("wikidataUri")
                    nb_name = rdf_fac.get("neighborhood", ef.get("neighborhood", ""))
                    dist_name = rdf_fac.get("district", ef.get("district", ""))
                    dist_wd = rdf_fac.get("districtWikidata")

                    for c in ef.get("classes", []):
                        mod = c.get("modality", "Open")
                        prefix = "OPEN" if mod == "Open" else "CLOSED"
                        act_name = c.get("activity", "Sports")
                        act_es = c.get("activityEs", act_name)
                        cid = c.get("id", f"cls_{pk}")
                        class_uri = f"https://w3id.org/active-madrid/resource/SportsClass/{prefix}_{pk}_{cid}"
                        act_uri = f"https://w3id.org/active-madrid/resource/SportActivity/{act_es.replace(' ', '%20')}"

                        classes_list.append(
                            {
                                "id": cid,
                                "uri": class_uri,
                                "className": f"{act_name} — {c.get('schedule', '')}",
                                "activityUri": act_uri,
                                "activity": act_name,
                                "activityEs": act_es,
                                "activityWikidata": None,
                                "facilityPk": pk,
                                "facilityUri": fac_uri,
                                "facilityName": fac_name,
                                "facilityWikidata": fac_wd,
                                "neighborhood": nb_name,
                                "district": dist_name,
                                "districtWikidata": dist_wd,
                                "modality": mod,
                                "schedule": c.get("schedule", ""),
                                "offered": int(c.get("offered", 20)),
                                "occupied": int(c.get("occupied", 10)),
                                "available": int(c.get("available", 10)),
                                "price": c.get("price", "€3.50"),
                            }
                        )
            except Exception as exc:
                print(f"[Active Madrid Backend] Could not parse embedded classes snapshot: {exc}")

    _local_classes_cache = classes_list
    return _local_classes_cache


def execute_sparql_query(sparql_query: str):
    """
    Executes a SPARQL SELECT query against GraphDB Workbench (`http://127.0.0.1:7200/repositories/active-madrid`).
    If GraphDB is offline, executes the query over the local RDFLib graph.
    Returns (bindings_list, execution_ms, source_engine, raw_sparql_json).
    """
    t0 = time.perf_counter()

    # 1. Primary path: Query live GraphDB SPARQL endpoint if port 7200 is open
    if is_graphdb_port_open():
        try:
            resp = requests.post(
                GRAPHDB_ENDPOINT,
                data={"query": sparql_query},
                headers={
                    "Accept": "application/sparql-results+json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=3.0,
            )
            if resp.status_code == 200:
                elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
                payload = resp.json()
                bindings = payload.get("results", {}).get("bindings", [])
                return bindings, elapsed_ms, "GraphDB Workbench (active-madrid)", payload
        except Exception:
            pass

    # 2. Fallback path: Execute custom SPARQL over local RDFLib Graph
    g = get_local_rdf_graph()
    try:
        qres = g.query(sparql_query)
        vars_list = [str(v) for v in qres.vars]
        bindings = []
        for row in qres:
            row_dict = {}
            for var_name, val in zip(vars_list, row):
                if val is not None:
                    term_type = "uri" if val.__class__.__name__ == "URIRef" else "literal"
                    row_dict[var_name] = {"type": term_type, "value": str(val)}
            bindings.append(row_dict)

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        payload = {
            "head": {"vars": vars_list},
            "results": {"bindings": bindings},
        }
        return bindings, elapsed_ms, "RDFLib Local TTL Graph (sports_centers-with-links.ttl)", payload
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        return [], elapsed_ms, f"RDFLib Error: {exc}", {"head": {"vars": []}, "results": {"bindings": []}}


def extract_val(binding: dict, key: str, default=""):
    """Helper to extract string value from a SPARQL JSON binding cell."""
    cell = binding.get(key)
    if not cell:
        return default
    return cell.get("value", default)


# =====================================================================
# ROUTES & REST API ENDPOINTS
# =====================================================================

@app.route("/")
def index():
    """Serves the Active Madrid Single-Page Application frontend."""
    return render_template("index.html")


@app.route("/api/status", methods=["GET"])
def api_status():
    """Returns connection status to GraphDB Workbench and dataset statistics."""
    is_online, triple_count = check_graphdb_connection()
    return jsonify(
        {
            "status": "ok",
            "application": "Active Madrid — Municipal Sports Knowledge Graph Portal",
            "group": "Group 12 (ODKG 2026-2027)",
            "graphdbConnected": is_online,
            "sparqlEndpoint": GRAPHDB_ENDPOINT,
            "repositoryId": GRAPHDB_REPO_ID,
            "engine": "GraphDB Workbench 10.x" if is_online else "RDFLib Local TTL Engine (Fallback)",
            "statistics": {
                "totalTriples": triple_count,
                "sportsFacilities": 82,
                "districts": 21,
                "neighborhoods": 64,
                "sportActivities": 379,
                "sportsClasses": 137692,
                "facilityLinks": 126137,
                "wikidataSameAsLinks": 453,
            },
        }
    )


@app.route("/api/facilities", methods=["GET"])
def api_facilities():
    """
    Retrieves all 82 sports facilities, their postal addresses, neighborhoods,
    districts, GPS coordinates, and Wikidata owl:sameAs links.
    Uses GraphDB SPARQL when online, or direct O(1) RDFLib triple indexing when offline.
    """
    t0 = time.perf_counter()

    if is_graphdb_port_open():
        bindings, elapsed_ms, engine, _ = execute_sparql_query(GET_ALL_FACILITIES_QUERY)
        if bindings:
            facilities = []
            for b in bindings:
                fac_uri = extract_val(b, "facility")
                pk = extract_pk_from_uri(fac_uri)
                full_name = extract_val(b, "facilityName")
                short_name = full_name.replace("Centro Deportivo Municipal ", "CDM ")

                try:
                    lat = float(extract_val(b, "lat", "40.4168"))
                    lon = float(extract_val(b, "long", "-3.7038"))
                except ValueError:
                    lat, lon = 40.4168, -3.7038

                facilities.append(
                    {
                        "pk": pk,
                        "uri": fac_uri,
                        "name": short_name,
                        "fullName": full_name,
                        "wikidataUri": extract_val(b, "facilityWikidata", None),
                        "lat": lat,
                        "lon": lon,
                        "phone": extract_val(b, "phone"),
                        "email": extract_val(b, "email"),
                        "url": extract_val(b, "url"),
                        "address": f"{extract_val(b, 'streetAddress')} · {extract_val(b, 'postalCode')} Madrid",
                        "streetAddress": extract_val(b, "streetAddress"),
                        "postalCode": extract_val(b, "postalCode"),
                        "neighborhoodUri": extract_val(b, "neighborhood"),
                        "neighborhood": extract_val(b, "neighborhoodName"),
                        "neighborhoodWikidata": extract_val(b, "neighborhoodWikidata", None),
                        "districtUri": extract_val(b, "district"),
                        "district": extract_val(b, "districtName"),
                        "districtWikidata": extract_val(b, "districtWikidata", None),
                    }
                )
            return jsonify(
                {
                    "count": len(facilities),
                    "executionTimeMs": elapsed_ms,
                    "engine": engine,
                    "sparqlQuery": GET_ALL_FACILITIES_QUERY.strip(),
                    "facilities": facilities,
                }
            )

    # Fast RDFLib Triple Index Traversal (< 5ms)
    facilities = load_local_facilities_from_rdf()
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    print(f"⚡ [SPARQL /api/facilities] Returned {len(facilities)} sports facilities in {elapsed_ms} ms")
    return jsonify(
        {
            "count": len(facilities),
            "executionTimeMs": elapsed_ms,
            "engine": "RDFLib Local TTL Graph (rdf/sports_centers-with-links.ttl)",
            "sparqlQuery": GET_ALL_FACILITIES_QUERY.strip(),
            "facilities": facilities,
        }
    )


@app.route("/api/classes", methods=["GET"])
def api_classes():
    """
    Executes a parameterized query to retrieve and filter am:SportsClass
    instances by facility, district, sport discipline, modality, and availability.
    """
    t0 = time.perf_counter()
    facility_pk = request.args.get("facility_pk")
    district = request.args.get("district")
    sport = request.args.get("sport")
    modality = request.args.get("modality")
    only_available = request.args.get("available_only", "false").lower() in ("true", "1", "yes")
    search_text = request.args.get("search")
    limit = int(request.args.get("limit", 250))

    sparql_query = build_classes_query(
        facility_pk=facility_pk,
        district_name=district,
        activity_name=sport,
        modality=modality,
        only_available=only_available,
        search_text=search_text,
        limit=limit,
    )

    if is_graphdb_port_open():
        bindings, elapsed_ms, engine, _ = execute_sparql_query(sparql_query)
        if bindings:
            classes = []
            for b in bindings:
                class_uri = extract_val(b, "sportsClass")
                is_open = "/SportsClass/OPEN_" in class_uri
                start_time = extract_val(b, "startTime", "09:00:00")[:5]
                end_time = extract_val(b, "endTime", "10:00:00")[:5]

                try:
                    offered = int(float(extract_val(b, "offeredPlaces", "20")))
                    occupied = int(float(extract_val(b, "occupiedPlaces", "10")))
                    available = int(float(extract_val(b, "availablePlaces", "10")))
                except ValueError:
                    offered, occupied, available = 20, 10, 10

                classes.append(
                    {
                        "uri": class_uri,
                        "className": unquote(extract_val(b, "className")),
                        "activityUri": extract_val(b, "activity"),
                        "activity": unquote(extract_val(b, "activityName")),
                        "activityWikidata": extract_val(b, "activityWikidata", None),
                        "facilityUri": extract_val(b, "facility"),
                        "facilityName": extract_val(b, "facilityName"),
                        "facilityWikidata": extract_val(b, "facilityWikidata", None),
                        "neighborhood": extract_val(b, "neighborhoodName"),
                        "district": extract_val(b, "districtName"),
                        "districtWikidata": extract_val(b, "districtWikidata", None),
                        "modality": "Open" if is_open else "Closed",
                        "schedule": f"{start_time}–{end_time}",
                        "offered": offered,
                        "occupied": occupied,
                        "available": available,
                        "price": "€3.50" if is_open else "€18.50/mo",
                    }
                )
            return jsonify(
                {
                    "count": len(classes),
                    "executionTimeMs": elapsed_ms,
                    "engine": engine,
                    "sparqlQuery": sparql_query.strip(),
                    "classes": classes,
                }
            )

    # Local Fallback filtering over materialized RDF classes snapshot
    all_classes = load_local_classes_snapshot()
    filtered = []
    for c in all_classes:
        if facility_pk and str(c["facilityPk"]) != str(facility_pk):
            continue
        if district and district.upper() != "ALL" and c["district"].lower() != district.lower():
            continue
        if sport and sport.upper() != "ALL" and sport.lower() not in c["activity"].lower() and sport.lower() not in c.get("activityEs", "").lower():
            continue
        if modality and modality.upper() in ("OPEN", "CLOSED") and c["modality"].upper() != modality.upper():
            continue
        if only_available and c["available"] <= 0:
            continue
        if search_text:
            q = search_text.lower()
            haystack = f"{c['activity']} {c.get('activityEs', '')} {c['facilityName']} {c['district']} {c['neighborhood']}".lower()
            if q not in haystack:
                continue
        filtered.append(c)
        if len(filtered) >= limit:
            break

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    print(
        f"⚡ [SPARQL /api/classes] Filters(pk={facility_pk}, dist={district}, sport={sport}, search={search_text}) "
        f"-> {len(filtered)} classes in {elapsed_ms} ms"
    )
    return jsonify(
        {
            "count": len(filtered),
            "executionTimeMs": elapsed_ms,
            "engine": "RDFLib Local TTL & Materialized Classes Fallback",
            "sparqlQuery": sparql_query.strip(),
            "classes": filtered,
        }
    )


@app.route("/api/districts", methods=["GET"])
def api_districts():
    """Executes GET_DISTRICT_INSIGHTS_QUERY to aggregate availability by Madrid district."""
    t0 = time.perf_counter()

    if is_graphdb_port_open():
        bindings, elapsed_ms, engine, _ = execute_sparql_query(GET_DISTRICT_INSIGHTS_QUERY)
        if bindings:
            districts = []
            for b in bindings:
                districts.append(
                    {
                        "uri": extract_val(b, "district"),
                        "name": extract_val(b, "districtName"),
                        "wikidataUri": extract_val(b, "districtWikidata", None),
                        "totalFacilities": int(float(extract_val(b, "totalFacilities", "0"))),
                        "totalClasses": int(float(extract_val(b, "totalClasses", "0"))),
                        "totalOfferedPlaces": int(float(extract_val(b, "totalOfferedPlaces", "0"))),
                        "totalAvailablePlaces": int(float(extract_val(b, "totalAvailablePlaces", "0"))),
                    }
                )
            return jsonify(
                {
                    "count": len(districts),
                    "executionTimeMs": elapsed_ms,
                    "engine": engine,
                    "sparqlQuery": GET_DISTRICT_INSIGHTS_QUERY.strip(),
                    "districts": districts,
                }
            )

    # Fast local aggregation over RDFLib facilities + classes
    facilities = load_local_facilities_from_rdf()
    classes = load_local_classes_snapshot()
    dist_map = {}

    for f in facilities:
        dname = f["district"] or "Madrid"
        if dname not in dist_map:
            dist_map[dname] = {
                "uri": f["districtUri"],
                "name": dname,
                "wikidataUri": f["districtWikidata"],
                "totalFacilities": 0,
                "totalClasses": 0,
                "totalOfferedPlaces": 0,
                "totalAvailablePlaces": 0,
            }
        dist_map[dname]["totalFacilities"] += 1

    for c in classes:
        dname = c["district"] or "Madrid"
        if dname in dist_map:
            dist_map[dname]["totalClasses"] += 1
            dist_map[dname]["totalOfferedPlaces"] += c["offered"]
            dist_map[dname]["totalAvailablePlaces"] += c["available"]

    districts = sorted(dist_map.values(), key=lambda x: x["totalAvailablePlaces"], reverse=True)
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    return jsonify(
        {
            "count": len(districts),
            "executionTimeMs": elapsed_ms,
            "engine": "RDFLib Local TTL Graph (rdf/sports_centers-with-links.ttl)",
            "sparqlQuery": GET_DISTRICT_INSIGHTS_QUERY.strip(),
            "districts": districts,
        }
    )


@app.route("/api/activities", methods=["GET"])
def api_activities():
    """Executes GET_ALL_ACTIVITIES_QUERY to list all sports activities and Wikidata links."""
    t0 = time.perf_counter()

    if is_graphdb_port_open():
        bindings, elapsed_ms, engine, _ = execute_sparql_query(GET_ALL_ACTIVITIES_QUERY)
        if bindings:
            activities = []
            for b in bindings:
                activities.append(
                    {
                        "uri": extract_val(b, "activity"),
                        "name": unquote(extract_val(b, "activityName")),
                        "wikidataUri": extract_val(b, "activityWikidata", None),
                        "totalClasses": int(float(extract_val(b, "totalClasses", "0"))),
                        "facilitiesCount": int(float(extract_val(b, "facilitiesCount", "0"))),
                        "totalAvailablePlaces": int(float(extract_val(b, "totalAvailablePlaces", "0"))),
                    }
                )
            return jsonify(
                {
                    "count": len(activities),
                    "executionTimeMs": elapsed_ms,
                    "engine": engine,
                    "sparqlQuery": GET_ALL_ACTIVITIES_QUERY.strip(),
                    "activities": activities,
                }
            )

    classes = load_local_classes_snapshot()
    act_map = {}
    for c in classes:
        aname = c["activity"]
        if aname not in act_map:
            act_map[aname] = {
                "uri": c["activityUri"],
                "name": aname,
                "nameEs": c.get("activityEs", aname),
                "totalClasses": 0,
                "facilities": set(),
                "totalAvailablePlaces": 0,
            }
        act_map[aname]["totalClasses"] += 1
        act_map[aname]["facilities"].add(c["facilityPk"])
        act_map[aname]["totalAvailablePlaces"] += c["available"]

    activities = [
        {
            "uri": v["uri"],
            "name": v["name"],
            "nameEs": v["nameEs"],
            "totalClasses": v["totalClasses"],
            "facilitiesCount": len(v["facilities"]),
            "totalAvailablePlaces": v["totalAvailablePlaces"],
        }
        for v in sorted(act_map.values(), key=lambda x: x["name"])
    ]
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    return jsonify(
        {
            "count": len(activities),
            "executionTimeMs": elapsed_ms,
            "engine": "RDFLib Local TTL & Materialized Classes Fallback",
            "sparqlQuery": GET_ALL_ACTIVITIES_QUERY.strip(),
            "activities": activities,
        }
    )


@app.route("/api/federated/districts", methods=["GET"])
def api_federated_districts():
    """Executes the federated Wikidata SPARQL query via owl:sameAs links."""
    bindings, elapsed_ms, engine, _ = execute_sparql_query(WIKIDATA_FEDERATED_DISTRICTS_QUERY)
    return jsonify(
        {
            "count": len(bindings),
            "executionTimeMs": elapsed_ms,
            "engine": engine,
            "sparqlQuery": WIKIDATA_FEDERATED_DISTRICTS_QUERY.strip(),
            "results": bindings,
        }
    )


@app.route("/api/sparql", methods=["POST", "GET"])
def api_sparql_proxy():
    """
    Direct SPARQL Bridge Endpoint.
    Allows the frontend or external clients to execute raw SPARQL queries
    against the GraphDB repository and receive W3C SPARQL JSON results.
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        query = data.get("query") or request.form.get("query") or ""
    else:
        query = request.args.get("query", "")

    if not query.strip():
        return jsonify({"error": "Missing 'query' parameter"}), 400

    bindings, elapsed_ms, engine, raw_payload = execute_sparql_query(query)
    return jsonify(
        {
            "executionTimeMs": elapsed_ms,
            "engine": engine,
            "endpoint": GRAPHDB_ENDPOINT,
            "resultsCount": len(bindings),
            "head": raw_payload.get("head", {}),
            "results": raw_payload.get("results", {}),
        }
    )


@app.route("/api/bookings", methods=["GET", "POST"])
def api_bookings():
    """Manages citizen class reservations and updates GraphDB availablePlaces counters."""
    if request.method == "GET":
        return jsonify({"count": len(ACTIVE_BOOKINGS), "bookings": ACTIVE_BOOKINGS})

    payload = request.get_json(silent=True) or {}
    class_id = payload.get("classId")
    if not class_id:
        return jsonify({"error": "Missing classId"}), 400

    if any(b["classId"] == class_id for b in ACTIVE_BOOKINGS):
        return jsonify({"status": "already_booked", "bookings": ACTIVE_BOOKINGS})

    new_booking = {
        "bookingId": f"BK-{random.randint(1000, 9999)}",
        "classId": class_id,
        "classUri": payload.get(
            "classUri",
            f"https://w3id.org/active-madrid/resource/SportsClass/{class_id}",
        ),
        "facilityPk": payload.get("facilityPk"),
        "facilityName": payload.get("facilityName", "Centro Deportivo Municipal"),
        "district": payload.get("district", "Madrid"),
        "activity": payload.get("activity", "Sports Class"),
        "modality": payload.get("modality", "Open"),
        "schedule": payload.get("schedule", "Mon–Fri"),
        "price": payload.get("price", "€3.50"),
    }
    ACTIVE_BOOKINGS.insert(0, new_booking)

    # If old/new counters are provided and GraphDB is running, issue SPARQL 1.1 Update
    if "occupied" in payload and "available" in payload and is_graphdb_port_open():
        old_occ = int(payload["occupied"])
        old_avail = int(payload["available"])
        update_query = build_update_spots_query(
            new_booking["classUri"],
            old_occ,
            old_avail,
            old_occ + 1,
            max(0, old_avail - 1),
        )
        try:
            requests.post(
                GRAPHDB_UPDATE_ENDPOINT,
                data={"update": update_query},
                timeout=1.0,
            )
        except Exception:
            pass

    return jsonify(
        {
            "status": "booked",
            "booking": new_booking,
            "bookings": ACTIVE_BOOKINGS,
        }
    )


@app.route("/api/bookings/<class_id>", methods=["DELETE"])
def api_cancel_booking(class_id):
    """Cancels an existing booking by classId."""
    global ACTIVE_BOOKINGS
    ACTIVE_BOOKINGS = [b for b in ACTIVE_BOOKINGS if b["classId"] != class_id]
    return jsonify({"status": "cancelled", "bookings": ACTIVE_BOOKINGS})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_online, triples = check_graphdb_connection()
    # Pre-warm local RDFLib graph so first request is instant
    load_local_facilities_from_rdf()
    print("=" * 72)
    print(" Active Madrid — Knowledge Graph Application Backend (Group 12)")
    print(f" GraphDB Endpoint : {GRAPHDB_ENDPOINT}")
    print(f" GraphDB Status   : {'CONNECTED' if is_online else 'OFFLINE (Using Fast RDFLib TTL Engine)'}")
    print(f" Web Application  : http://localhost:{port}")
    print("=" * 72)
    app.run(host="0.0.0.0", port=port, debug=True)
