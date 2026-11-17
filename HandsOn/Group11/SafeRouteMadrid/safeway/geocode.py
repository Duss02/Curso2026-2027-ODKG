"""Offline geocoding for Madrid: typed text -> a point on the map.

The index is built once from the same OpenStreetMap extract as the street network:
  addresses: every node/building with addr:street + addr:housenumber   (street, number -> point)
  places:    named stations, squares, parks, stadiums, hospitals, museums... (name -> point)
  streets:   every named street of the drive and bike networks          (name -> middle point)

`resolve(text)` asks the local LLM (safeway.llm) what the text refers to, falls back to simple
rules when the LLM is not available, and then matches the result against the index with
typo-tolerant fuzzy search (RapidFuzz). The LLM never invents coordinates: every answer is a
real OSM street, address or place.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache

import pandas as pd
from rapidfuzz import fuzz, process

from safeway import config, llm, streets

ADDRESSES = config.PROCESSED_DIR / "addresses.parquet"
PLACES = config.PROCESSED_DIR / "places.parquet"
STREETS = config.PROCESSED_DIR / "streets.parquet"

PLACE_TAGS = {
    "railway": {"station", "halt"}, "public_transport": {"station"}, "station": {"subway", "light_rail"},
    "place": {"square", "neighbourhood", "quarter", "suburb"},
    "leisure": {"park", "stadium", "sports_centre", "garden"},
    "tourism": {"museum", "attraction", "gallery", "zoo", "theme_park"},
    "amenity": {"hospital", "university", "college", "townhall", "theatre", "cinema", "library",
                "marketplace", "bus_station", "place_of_worship", "school", "police", "fire_station",
                "courthouse", "arts_centre", "conference_centre"},
    "historic": {"monument", "memorial", "castle", "palace", "city_gate", "building"},
    "shop": {"mall", "department_store"},
    "aeroway": {"terminal", "aerodrome"},
}

# Street-type words that people type in many ways ("c/", "av.", "pº"...). Removed for matching.
STREET_TYPES = r"(calle|cl|call|avenida|avda|av|paseo|pso|po|plaza|pza|pl|plz|glorieta|gta|ronda|rda|" \
               r"camino|cmno|carretera|ctra|travesia|trv|costanilla|cuesta|callejon|pasaje|psje|via|autovia|" \
               r"autov|bulevar|boulevard|street|st|avenue|square)"
STOPWORDS = {"de", "del", "la", "las", "los", "el", "y"}


@dataclass
class Match:
    label: str
    lat: float
    lon: float
    kind: str        # "address", "street" or "place"
    score: float     # 0-100


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text).lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"^\s*c\s*/\s*", "calle ", text)              # "C/ Goya", "c/goya"
    text = re.sub(r"[º°ª.,;:()'\"]", " ", text)
    text = re.sub(rf"^\s*{STREET_TYPES}(?!\w)\s*", " ", text)
    words = [w for w in text.split() if w not in STOPWORDS]
    return " ".join(words)


# --------------------------------------------------------------------------- index build

def build_index(log=print) -> None:
    """Extract addresses and places from the OSM extract; street names from the networks."""
    import osmium

    b = config.MADRID_BBOX
    inside = lambda lat, lon: b["south"] <= lat <= b["north"] and b["west"] <= lon <= b["east"]  # noqa: E731
    addresses, places = [], []

    def place_kind(tags) -> str | None:
        for key, values in PLACE_TAGS.items():
            if tags.get(key) in values:
                return f"{key}={tags[key]}"
        return None

    def point(obj):
        if obj.is_node():
            return (obj.location.lat, obj.location.lon) if obj.location.valid() else None
        pts = [(n.location.lat, n.location.lon) for n in obj.nodes if n.location.valid()]
        if not pts:
            return None
        return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)

    for obj in osmium.FileProcessor(str(streets.EXTRACT), osmium.osm.NODE | osmium.osm.WAY).with_locations():
        tags = obj.tags
        street, number, name = tags.get("addr:street"), tags.get("addr:housenumber"), tags.get("name")
        kind = place_kind(tags) if name else None
        if not ((street and number) or kind):
            continue
        p = point(obj)
        if p is None or not inside(*p):
            continue
        if street and number:
            addresses.append((street, number, p[0], p[1]))
        if kind:
            places.append((name, kind, p[0], p[1]))

    config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    a = pd.DataFrame(addresses, columns=["street", "number", "lat", "lon"]).drop_duplicates(["street", "number"])
    a["key"] = a["street"].map(normalize)
    a["num"] = pd.to_numeric(a["number"].str.extract(r"(\d+)")[0], errors="coerce")
    a.to_parquet(ADDRESSES)
    p = pd.DataFrame(places, columns=["name", "kind", "lat", "lon"]).drop_duplicates(["name", "kind"])
    p["key"] = p["name"].map(normalize)
    p.to_parquet(PLACES)

    rows = {}
    for network in ("drive", "bike"):
        g = streets.load(network)
        for u, v, data in g.edges(data=True):
            name = streets.edge_name(data)
            if name != "Unnamed street" and " / " not in name:
                rows.setdefault(name, []).append((g.nodes[u]["lat"], g.nodes[u]["lon"]))
    s = pd.DataFrame([(n, *sorted(pts)[len(pts) // 2]) for n, pts in rows.items()],
                     columns=["street", "lat", "lon"])
    s["key"] = s["street"].map(normalize)
    s.to_parquet(STREETS)
    log(f"  geocoding index: {len(a):,} addresses, {len(p):,} places, {len(s):,} streets")


@lru_cache(maxsize=1)
def _index() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    return pd.read_parquet(ADDRESSES), pd.read_parquet(PLACES), pd.read_parquet(STREETS)


def is_built() -> bool:
    return ADDRESSES.exists() and PLACES.exists() and STREETS.exists()


# --------------------------------------------------------------------------- search

def _fold(text: str) -> str:
    """Lowercase without accents, keeping the street type (for tie-breaks)."""
    text = unicodedata.normalize("NFKD", str(text).lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def _rank(query: str, matches: list[Match]) -> list[Match]:
    """Best score first; ties broken by similarity to the full text, street type included."""
    q = _fold(query)
    return sorted(matches, key=lambda m: (-round(m.score), -fuzz.token_set_ratio(q, _fold(m.label))))


def find_street(name: str, limit: int = 5) -> list[Match]:
    _, _, s = _index()
    key = normalize(name)
    if not key:
        return []
    hits = process.extract(key, s["key"].tolist(), scorer=fuzz.WRatio, limit=limit * 4, score_cutoff=70)
    found = [Match(s.iloc[i]["street"], s.iloc[i]["lat"], s.iloc[i]["lon"], "street", score)
             for _, score, i in hits]
    return _rank(name, found)[:limit]


def find_address(street: str, number: str, limit: int = 5) -> list[Match]:
    """House number on the best-matching street: exact number, else the closest on the same side."""
    a, _, _ = _index()
    out = []
    for st in find_street(street, limit=3):
        rows = a[a["street"] == st.label]
        if rows.empty:
            out.append(st)
            continue
        exact = rows[rows["number"].str.lower() == str(number).strip().lower()]
        if exact.empty:
            n = pd.to_numeric(re.sub(r"\D", "", str(number)) or "nan", errors="coerce")
            if pd.isna(n):
                out.append(st)
                continue
            same_side = rows[rows["num"] % 2 == n % 2]
            pool = same_side if not same_side.empty else rows
            exact = pool.iloc[[(pool["num"] - n).abs().argmin()]]
        r = exact.iloc[0]
        out.append(Match(f"{r['street']}, {r['number']}", r["lat"], r["lon"], "address", st.score))
    return out[:limit]


def find_place(name: str, limit: int = 5) -> list[Match]:
    _, p, _ = _index()
    key = normalize(name)
    if not key:
        return []
    hits = process.extract(key, p["key"].tolist(), scorer=fuzz.WRatio, limit=limit * 4, score_cutoff=70)
    found = [Match(p.iloc[i]["name"], p.iloc[i]["lat"], p.iloc[i]["lon"], "place", score)
             for _, score, i in hits]
    return _rank(name, found)[:limit]


def _rules(text: str) -> dict:
    """Fallback interpretation when no LLM is available: 'street [number]'."""
    m = re.match(r"^\s*(.*?)[\s,]+(?:n[º°o]?\.?\s*)?(\d+\s*[a-zA-Z]?)\s*$", text)
    if m:
        return {"kind": "address", "street": m[1], "number": m[2].replace(" ", ""), "place": ""}
    return {"kind": "street_or_place", "street": text, "number": "", "place": text}


def resolve(text: str, use_llm: bool = True) -> tuple[list[Match], dict]:
    """Best matches for `text`, and how the text was interpreted (for transparency in the UI)."""
    text = text.strip()
    if not text:
        return [], {}
    parsed = llm.interpret(text) if use_llm else None
    source = "llm"
    if not parsed:
        parsed, source = _rules(text), "rules"
    parsed["source"] = source
    matches: list[Match] = []
    if parsed.get("street") and parsed.get("number"):
        matches += find_address(parsed["street"], parsed["number"])
    elif parsed.get("street"):
        matches += find_street(parsed["street"])
    if parsed.get("place"):
        matches += find_place(parsed["place"])
    if not matches:                                     # last resort: the raw text everywhere
        matches = find_street(text) + find_place(text)
    seen, unique = set(), []
    for m in _rank(text, matches):
        if m.label not in seen:
            seen.add(m.label)
            unique.append(m)
    return unique[:6], parsed
