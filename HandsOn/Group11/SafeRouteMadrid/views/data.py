"""The Linked Data behind the app: loaded CSVs, named graphs, SPARQL, and adding new CSV files."""
from __future__ import annotations

import pandas as pd
import streamlit as st

from safeway import config, pipeline, queries, rdf
from ui import cache

st.markdown("## Linked data")
st.caption("Every CSV in `data/raw/` is cleaned (the group's OpenRefine steps), linked to Wikidata, "
           "mapped to RDF with the SafeRoute RML mapping and loaded into a local Oxigraph "
           "triplestore as its own named graph. The routes are computed from SPARQL results.")

manifest = rdf.read_manifest()["files"]
if manifest:
    st.markdown("#### Loaded files")
    st.dataframe(pd.DataFrame([{"File": v["file"], "Triples": v["triples"], "Loaded": v["loaded_at"],
                                "Named graph": config.DATA_GRAPH_PREFIX + k}
                               for k, v in manifest.items()]),
                 hide_index=True, width="stretch",
                 column_config={"Triples": st.column_config.NumberColumn(format="%d")})

st.caption("To add or remove CSV files, use **Options → Accident data**.")

if not pipeline.is_built():
    st.info("Nothing is built yet: add CSV files in **Options** or run `python scripts/build.py`.")
    st.stop()

st.markdown("#### Named graphs")
st.dataframe(queries.graph_summary(cache.store()), hide_index=True, width="stretch")

st.markdown("#### SPARQL")
validation = queries.split_queries(queries.load_query("validation"))
choices = {"Accidents used by the app": queries.load_query("accidents") + "\nLIMIT 50"}
choices.update({title: q for title, q in validation})
choice = st.selectbox("Query", list(choices))
text = st.text_area("SPARQL (the default graph is the union of all named graphs)", choices[choice],
                    height=260)
if st.button("Run query"):
    try:
        with st.spinner("Running…"):
            df = queries.select(cache.store(), text)
        st.caption(f"{len(df):,} rows")
        st.dataframe(df.head(1000), hide_index=True, width="stretch")
    except Exception as error:
        st.error(str(error))
