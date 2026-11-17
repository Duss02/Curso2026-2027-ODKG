"""Helpers shared by the pages of the app."""
import requests
import streamlit as st

import data
import queries as q

PREFIX = "Instalación Deportiva Municipal Básica "

# Air quality categories: colour + text (the colour is never the only cue).
CATEGORIES = {
    "Bueno": "#2c7bb6",
    "Moderado": "#fdae61",
    "Malo": "#d7191c",
    "Dato no válido": "#9e9e9e",
    "Sin medición": "#d9d9d9",
}


def short_name(name):
    """Facility name without the common prefix of the dataset."""
    return name[len(PREFIX):] if name.startswith(PREFIX) else name


def slug(iri):
    """Last part of an IRI, e.g. .../sports-facility/acuario -> acuario."""
    return iri.rstrip("/").rsplit("/", 1)[-1]


def category(value, valid, reference):
    if value is None or value != value:  # None or NaN
        return "Sin medición"
    if not valid:
        return "Dato no válido"
    if value <= reference:
        return "Bueno"
    if value <= 2 * reference:
        return "Moderado"
    return "Malo"


def pollutant_table():
    """Pollutants with a reference value: name, code, EDINT property and unit."""
    df = data.query(q.pollutants())
    df["slug"] = df["pollutant"].map(slug)
    df["reference"] = df["slug"].map(q.REFERENCE)
    df["unit"] = df["slug"].map(lambda s: "mg/m³" if s == "co" else "µg/m³")
    order = list(q.REFERENCE)
    return df.sort_values("slug", key=lambda s: s.map(order.index)).reset_index(drop=True)


@st.cache_data(show_spinner=False, ttl=24 * 3600)
def wikidata_summary(entity_iri):
    """Label and description of a Wikidata entity (Spanish, else English)."""
    qid = slug(entity_iri)
    try:
        response = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={"action": "wbgetentities", "ids": qid, "props": "labels|descriptions",
                    "languages": "es|en", "format": "json"},
            headers={"User-Agent": "BreathePlayMadrid-demo/0.1 (UPM course project)"},
            timeout=10,
        )
        entity = response.json()["entities"][qid]
    except Exception:
        return None
    def pick(field):
        values = entity.get(field, {})
        return (values.get("es") or values.get("en") or {}).get("value", "")
    return {"label": pick("labels"), "description": pick("descriptions"),
            "url": f"https://www.wikidata.org/wiki/{qid}"}


@st.cache_data(show_spinner="Consultando Wikidata...", ttl=24 * 3600)
def wikidata_districts(qids):
    """Population, its date and area of the districts, from the Wikidata SPARQL
    endpoint. Returns an empty table if Wikidata cannot be reached."""
    try:
        df = data.query_endpoint(
            q.WIKIDATA_ENDPOINT, q.wikidata_districts(qids), timeout=30,
            headers={"User-Agent": "BreathePlayMadrid-demo/0.1 (UPM course project)"})
    except Exception:
        return None
    if df.empty:
        return None
    df["qid"] = df["district"].map(slug)
    df["date"] = df["date"].fillna("")
    # if there are several population values, keep the most recent one
    df = df.sort_values("date").groupby("qid", as_index=False).last()
    df["year"] = df["date"].str[:4]
    return df[["qid", "population", "year", "area"]]


def sidebar_footer():
    st.sidebar.divider()
    st.sidebar.caption(
        "Datos: Ayuntamiento de Madrid (datos.madrid.es), licencia CC BY 4.0. "
        "Enlaces: Wikidata (CC0). Vocabularios: EDINT, SOSA, GeoSPARQL, QUDT, OWL-Time."
    )
    st.sidebar.caption(f"Fuente de las consultas: {data.source_name()}")
