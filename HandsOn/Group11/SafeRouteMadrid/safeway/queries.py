"""SPARQL over the local triplestore, returned as pandas DataFrames."""
from __future__ import annotations

import re

import pandas as pd
import pyoxigraph as ox

from safeway import config


def _value(term) -> object:
    if term is None:
        return None
    if isinstance(term, ox.Literal):
        dt = term.datatype.value
        if dt.endswith(("#double", "#decimal", "#float")):
            return float(term.value)
        if dt.endswith("#integer"):
            return int(term.value)
        if dt.endswith("#boolean"):
            return term.value == "true"
        return term.value
    return term.value


def select(store: ox.Store, query: str, union: bool = True) -> pd.DataFrame:
    """Run a SELECT query; by default the default graph is the union of all named graphs."""
    result = store.query(query, use_default_graph_as_union=union)
    if isinstance(result, bool):
        return pd.DataFrame({"ask": [result]})
    columns = [v.value for v in result.variables]
    rows = [[_value(solution[c]) for c in columns] for solution in result]
    return pd.DataFrame(rows, columns=columns)


def load_query(name: str) -> str:
    return (config.QUERIES_DIR / f"{name}.sparql").read_text(encoding="utf-8")


def accidents(store: ox.Store) -> pd.DataFrame:
    """One row per accident with position, vehicle types (list) and severity codes (list)."""
    df = select(store, load_query("accidents"))
    for col in ("vehicleTypes", "severityCodes"):
        df[col] = df[col].fillna("").map(lambda s: [v for v in s.split("|") if v])
    df["id"] = df["accident"].str.rsplit("/", n=1).str[-1]
    return df


def split_queries(text: str) -> list[tuple[str, str]]:
    """Split a file with several queries headed by '# N. Title' comments into (title, query)."""
    parts = re.split(r"(?m)^#\s*(\d+\.\s.*)$", text)
    return [(parts[i].strip(), parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]


def graph_summary(store: ox.Store) -> pd.DataFrame:
    q = """SELECT ?graph (COUNT(*) AS ?triples) WHERE { GRAPH ?graph { ?s ?p ?o } }
           GROUP BY ?graph ORDER BY ?graph"""
    return select(store, q, union=False)


def duplicate_accidents(store: ox.Store) -> int:
    """Accidents present in more than one CSV graph (the same data added twice)."""
    q = """PREFIX ns: <https://w3id.org/saferoutemadrid/ontology#>
           SELECT (COUNT(DISTINCT ?a) AS ?n) WHERE {
             GRAPH ?g1 { ?a a ns:TrafficAccident } GRAPH ?g2 { ?a a ns:TrafficAccident }
             FILTER(?g1 != ?g2) }"""
    return int(select(store, q, union=False)["n"].iloc[0])
