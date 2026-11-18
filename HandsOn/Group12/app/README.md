# Active Madrid — Knowledge Graph Web Application (`app/`)

This directory contains the **Backend** and **Frontend** implementation of **Active Madrid**, the citizen-facing web application powered by Group 12's Linked Data Knowledge Graph (`1,101,209` RDF triples).

---

## 1. Architecture Overview

```
+-------------------------------------------------------------------+
|                 Active Madrid Frontend (SPA UI)                   |
|                  app/templates/index.html                         |
|  - Interactive 21-District SVG Map & 82 Sports Center Pins        |
|  - Real-time Filtering by Sport, District, Modality & Spots       |
|  - Schedule Explorer, District Insights & Citizen Booking Pass    |
+-------------------------------------------------------------------+
                                 |
                    REST JSON + SPARQL Proxy API
                                 v
+-------------------------------------------------------------------+
|                  Python Flask Backend Server                      |
|              app/backend.py  &  app/sparql_queries.py             |
|  - /api/status             (GraphDB connectivity & triple stats)  |
|  - /api/facilities         (Multi-hop Facility -> District query) |
|  - /api/classes            (Parameterized SportsClass filtering)  |
|  - /api/districts          (District-level capacity aggregation)  |
|  - /api/activities         (SportActivity + Wikidata QIDs)        |
|  - /api/federated/districts(Live Wikidata SERVICE query)          |
|  - /api/sparql             (Direct W3C SPARQL JSON bridge)        |
|  - /api/bookings           (Reservations + SPARQL 1.1 Update)     |
+-------------------------------------------------------------------+
                                 |
               HTTP SPARQL Protocol (Port 7200)
                                 v
+-------------------------------------------------------------------+
|              GraphDB Workbench Triplestore (`active-madrid`)      |
|        http://localhost:7200/repositories/active-madrid           |
|  - Ontology: ../ontology/active_madrid.ttl                        |
|  - RDF Data: ../rdf/sports_centers-with-links.ttl                 |
|              ../rdf/open_classes-with-links.ttl                   |
|              ../rdf/closed_classes-with-links.ttl                 |
+-------------------------------------------------------------------+
```

> **Automatic Local RDF Fallback:** If GraphDB Workbench is not running on `http://localhost:7200`, `backend.py` automatically falls back to an in-memory **RDFLib** graph loaded directly from `../ontology/active_madrid.ttl` and `../rdf/sports_centers-with-links.ttl`.

---

## 2. File Structure

* `backend.py`: Flask server exposing the REST API and SPARQL proxy endpoints connected to GraphDB Workbench.
* `sparql_queries.py`: Module containing all parameterized SPARQL `SELECT` and `UPDATE` queries over the `https://w3id.org/active-madrid/ontology#` (`am:`) schema, `schema.org`, `geo:wgs84_pos#`, `time:`, and `owl:sameAs` links to Wikidata (`wd:`).
* `templates/index.html`: Reactive Single-Page Application (SPA) frontend for exploring Madrid's 82 municipal sports centers, filtering 1,946 class schedules, inspecting district-level capacity, and booking available spots.
* `requirements.txt`: Python package dependencies (`Flask`, `requests`, `rdflib`, `SPARQLWrapper`).

---

## 3. Running the Application

### Step 1: Start GraphDB Workbench (Optional — Automatic RDFLib Fallback Included)
Ensure your local GraphDB instance is running on `http://localhost:7200` with the repository ID `active-madrid` containing:
* `ontology/active_madrid.ttl`
* `rdf/sports_centers-with-links.ttl`
* `rdf/open_classes-with-links.ttl`
* `rdf/closed_classes-with-links.ttl`

### Step 2: Install Python Dependencies
```bash
cd HandsOn/Group12/app
pip install -r requirements.txt
```

### Step 3: Run the Backend Server
```bash
python backend.py
```
The application will start at **`http://localhost:5000`**.

---

## 4. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the Active Madrid web application UI (`templates/index.html`). |
| `GET` | `/api/status` | Checks GraphDB connection (`http://localhost:7200/repositories/active-madrid`) and returns triple statistics. |
| `GET` | `/api/facilities` | Executes `GET_ALL_FACILITIES_QUERY` (Facility $\rightarrow$ PostalAddress $\rightarrow$ Neighborhood $\rightarrow$ District $\rightarrow$ Wikidata `owl:sameAs`). |
| `GET` | `/api/classes` | Executes `build_classes_query()` with query parameters: `facility_pk`, `district`, `sport`, `modality`, `available_only`, `search`, `limit`. |
| `GET` | `/api/districts` | Executes `GET_DISTRICT_INSIGHTS_QUERY` (`GROUP BY ?district`) to compute offered and available places per district. |
| `GET` | `/api/activities` | Executes `GET_ALL_ACTIVITIES_QUERY` returning all `am:SportActivity` instances and their Wikidata QIDs. |
| `GET` | `/api/federated/districts` | Executes `WIKIDATA_FEDERATED_DISTRICTS_QUERY` (`SERVICE <https://query.wikidata.org/sparql>`) to enrich districts with Wikidata properties. |
| `POST` | `/api/sparql` | Direct SPARQL proxy bridge executing custom SPARQL queries and returning standard `application/sparql-results+json`. |
| `GET/POST` | `/api/bookings` | Lists or creates citizen class bookings and issues a SPARQL 1.1 `DELETE/INSERT` update on `am:availablePlaces`. |
