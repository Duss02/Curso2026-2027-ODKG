"""Access to the Breathe & Play Madrid knowledge graph.

The app sends SPARQL queries to one of two sources:

- GraphDB (default): the SPARQL endpoint of the repository where the graph is
  published, http://localhost:7200/repositories/breatheplay
- local (fallback): if GraphDB is not running, the RDF files of Hands-on 6 are
  loaded in memory with pyoxigraph, an RDF store that runs inside Python.

Another endpoint can be given in the environment variable BPM_SPARQL_ENDPOINT
(the value "local" always uses the RDF files):
    set BPM_SPARQL_ENDPOINT=http://localhost:7200/repositories/otro   (Windows)
    export BPM_SPARQL_ENDPOINT=http://localhost:7200/repositories/otro (Linux/Mac)
"""
import os
from pathlib import Path

import pandas as pd
import requests
import streamlit as st

GROUP_DIR = Path(__file__).resolve().parent.parent  # HandsOn/Group04
RDF_FILES = [
    GROUP_DIR / "rdf" / "calidad-aire-diario-2024-reuse.ttl",
    GROUP_DIR / "rdf" / "estaciones-control-aire-reuse.ttl",
    GROUP_DIR / "rdf" / "instalaciones-deportivas-reuse.ttl",
    GROUP_DIR / "ontology" / "breatheplay-kos.ttl",
    GROUP_DIR / "ontology" / "breatheplay-reuse.ttl",
]
DEFAULT_ENDPOINT = "http://localhost:7200/repositories/breatheplay"
ENDPOINT = os.environ.get("BPM_SPARQL_ENDPOINT", "").strip() or DEFAULT_ENDPOINT

XSD = "http://www.w3.org/2001/XMLSchema#"
NUMBER_TYPES = {XSD + t for t in ("decimal", "double", "float", "integer", "int", "long")}


@st.cache_resource(show_spinner=False)
def use_endpoint():
    """True if the SPARQL endpoint answers (checked once, when the app starts)."""
    if ENDPOINT.lower() == "local":
        return False
    try:
        response = requests.post(ENDPOINT, data={"query": "ASK { ?s ?p ?o }"},
                                 headers={"Accept": "application/sparql-results+json"},
                                 timeout=5)
        response.raise_for_status()
        return response.json().get("boolean") is True  # the repository is not empty
    except Exception:
        return False


def source_name():
    if use_endpoint():
        return f"GraphDB ({ENDPOINT})"
    return "RDF local (pyoxigraph): GraphDB no está disponible"


def _convert(value, datatype):
    """Turns an RDF literal into a Python value (number, bool or text)."""
    if datatype in NUMBER_TYPES:
        return float(value)
    if datatype == XSD + "boolean":
        return value == "true"
    return value


@st.cache_resource(show_spinner="Cargando el grafo (unos segundos)...")
def _local_store():
    import pyoxigraph as ox

    store = ox.Store()
    for path in RDF_FILES:
        store.bulk_load(path=str(path), format=ox.RdfFormat.TURTLE)
    return store


def _query_local(sparql):
    import pyoxigraph as ox

    result = _local_store().query(sparql)
    names = [v.value for v in result.variables]
    rows = []
    for solution in result:
        row = {}
        for name in names:
            term = solution[name]
            if term is None:
                row[name] = None
            elif isinstance(term, ox.Literal):
                row[name] = _convert(term.value, term.datatype.value)
            else:
                row[name] = term.value
        rows.append(row)
    return pd.DataFrame(rows, columns=names)


def to_dataframe(result):
    """SPARQL JSON results (W3C format) -> table (DataFrame)."""
    names = result["head"]["vars"]
    rows = []
    for binding in result["results"]["bindings"]:
        row = {}
        for name in names:
            term = binding.get(name)
            if term is None:
                row[name] = None
            elif term["type"] == "literal":
                row[name] = _convert(term["value"], term.get("datatype", ""))
            else:
                row[name] = term["value"]
        rows.append(row)
    return pd.DataFrame(rows, columns=names)


def query_endpoint(endpoint, sparql, timeout=60, headers=None):
    """Sends a SPARQL SELECT query to an endpoint (GraphDB, Wikidata...)."""
    response = requests.post(
        endpoint,
        data={"query": sparql},
        headers={"Accept": "application/sparql-results+json", **(headers or {})},
        timeout=timeout,
    )
    response.raise_for_status()
    return to_dataframe(response.json())


@st.cache_data(show_spinner=False)
def query(sparql):
    """Runs a SPARQL SELECT query over our graph and returns the results as a table."""
    return query_endpoint(ENDPOINT, sparql) if use_endpoint() else _query_local(sparql)
