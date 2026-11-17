"""Madrid street networks from OpenStreetMap, built locally from an OSM extract.

The public Overpass API is often overloaded, so instead of querying it SafeRoute Madrid downloads one
OSM extract of Madrid (BBBike, ~80 MB, once), keeps the ways that OSMnx would keep for the 'drive'
or 'bike' network (OSMnx's own filter rules), lets OSMnx build and simplify the graph, and clips it
to the Madrid municipality boundary.

Graphs are projected to UTM 30N (EPSG:25830), the same system as the accident coordinates, so
distances are in metres. Every node keeps its WGS84 position in `lon`/`lat`.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from xml.sax.saxutils import quoteattr

import networkx as nx

from safeway import config

EXTRACT_URL = "https://download.bbbike.org/osm/bbbike/Madrid/Madrid.osm.pbf"
EXTRACT = config.STREETS_DIR / "madrid.osm.pbf"
PLACE = "Madrid, Comunidad de Madrid, España"


def graph_path(network: str) -> Path:
    return config.STREETS_DIR / f"madrid_{network}.graphml"


def download_extract(log=print) -> Path:
    import requests

    if EXTRACT.exists():
        return EXTRACT
    log(f"Downloading the Madrid OpenStreetMap extract from {EXTRACT_URL} (~80 MB, one time)")
    config.STREETS_DIR.mkdir(parents=True, exist_ok=True)
    tmp = EXTRACT.with_suffix(".part")
    with requests.get(EXTRACT_URL, stream=True, timeout=60,
                      headers={"User-Agent": "SafeRoute-Madrid/1.0 (local route-safety app)"}) as r:
        r.raise_for_status()
        with open(tmp, "wb") as fh:
            for chunk in r.iter_content(1 << 20):
                fh.write(chunk)
    tmp.replace(EXTRACT)
    return EXTRACT


def way_filter(network: str):
    """OSMnx's Overpass filter for `network`, as a Python predicate over a way's tags."""
    from osmnx import _overpass

    rules = re.findall(r'\["([^"]+)"(?:(!~)"([^"]*)")?\]', _overpass._get_network_filter(network))

    def keep(tags) -> bool:
        for key, op, pattern in rules:
            value = tags.get(key)
            if not op:                       # ["highway"]: the key must exist
                if value is None:
                    return False
            elif value is not None and re.search(pattern, value):   # ["k"!~"regex"]
                return False
        return True

    return keep


def _write_xml(network: str, out: Path) -> int:
    """Write the ways of `network` (and their nodes) from the extract as OSM XML for OSMnx."""
    import osmium

    keep = way_filter(network)
    nodes: dict[int, tuple[float, float]] = {}
    ways = []
    for w in osmium.FileProcessor(str(EXTRACT), osmium.osm.NODE | osmium.osm.WAY).with_locations():
        if not w.is_way():
            continue
        tags = {t.k: t.v for t in w.tags}
        if not keep(tags):
            continue
        refs = []
        for n in w.nodes:
            if n.location.valid():
                nodes[n.ref] = (n.location.lat, n.location.lon)
                refs.append(n.ref)
        if len(refs) >= 2:
            ways.append((w.id, refs, tags))
    with open(out, "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="SafeRoute Madrid">\n')
        for nid, (lat, lon) in nodes.items():
            fh.write(f'<node id="{nid}" lat="{lat:.7f}" lon="{lon:.7f}"/>\n')
        for wid, refs, tags in ways:
            fh.write(f'<way id="{wid}">')
            fh.write("".join(f'<nd ref="{r}"/>' for r in refs))
            fh.write("".join(f"<tag k={quoteattr(k)} v={quoteattr(v)}/>" for k, v in tags.items()))
            fh.write("</way>\n")
        fh.write("</osm>\n")
    return len(ways)


def download(network: str, log=print) -> nx.MultiDiGraph:
    """Build the Madrid network ('drive' or 'bike') and cache it. Needs internet the first time."""
    import tempfile

    import osmnx as ox

    ox.settings.use_cache = True
    ox.settings.cache_folder = str(config.STREETS_DIR / "osm_cache")
    download_extract(log)
    with tempfile.TemporaryDirectory() as tmp:
        xml = Path(tmp) / f"{network}.osm"
        log(f"  {network}: {_write_xml(network, xml):,} OSM ways")
        g = ox.graph_from_xml(xml, simplify=True, retain_all=True)
    boundary = ox.geocode_to_gdf(PLACE).union_all()      # Nominatim, cached in osm_cache/
    g = ox.truncate.truncate_graph_polygon(g, boundary)
    g = ox.truncate.largest_component(g, strongly=True)
    for _, data in g.nodes(data=True):                    # keep WGS84 before projecting
        data["lon"], data["lat"] = data["x"], data["y"]
    g = ox.project_graph(g, to_crs=f"EPSG:{config.UTM_EPSG}")
    ox.save_graphml(g, graph_path(network))
    return g


@lru_cache(maxsize=2)
def load(network: str) -> nx.MultiDiGraph:
    """Load a cached network. Raises FileNotFoundError if `scripts/build.py` has not run."""
    import osmnx as ox

    path = graph_path(network)
    if not path.exists():
        raise FileNotFoundError(f"{path.name} not found: run `python scripts/build.py` first")
    return ox.load_graphml(path, node_dtypes={"lon": float, "lat": float})


def edge_name(data: dict) -> str:
    """OSM street name of an edge, which may be missing or a list after simplification."""
    name = data.get("name")
    if isinstance(name, list):
        name = " / ".join(dict.fromkeys(str(n) for n in name))
    return str(name) if name else "Unnamed street"
