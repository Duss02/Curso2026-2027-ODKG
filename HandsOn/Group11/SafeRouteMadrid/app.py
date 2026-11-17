"""SafeRoute Madrid. Run locally with:

    streamlit run app.py

Reads only data/processed/ and the cached street networks (built by scripts/build.py), so it
starts offline. The Data page opens the triplestore for SPARQL and for adding new CSV files.
"""
from __future__ import annotations

import streamlit as st

from safeway import llm, pipeline, settings
from ui import theme

st.set_page_config(page_title="SafeRoute Madrid", page_icon="🛣️", layout="wide")

chosen_theme = settings.load().theme
if theme.apply(chosen_theme):   # the browser gets the new theme at the start of the next run
    st.rerun()
st.html(theme.css(chosen_theme))

pages = [
    st.Page("views/plan.py", title="Plan a route", icon="🧭", default=True),
    st.Page("views/whatif.py", title="What if…?", icon="🔮", url_path="whatif"),
    st.Page("views/hotspots.py", title="Accident hotspots", icon="⚠️", url_path="hotspots"),
    st.Page("views/data.py", title="Linked data", icon="🗂️", url_path="data"),
    st.Page("views/options.py", title="Options", icon="⚙️", url_path="options"),
]
current = st.navigation(pages)

with st.sidebar:
    st.markdown("### SafeRoute Madrid")
    st.caption("Safer navigation through Madrid, from the city's traffic-accident open data "
               "published as Linked Data.")
    if llm.available():
        st.caption(f"🤖 Search assistant: {llm.MODEL} (local, Ollama)")
    else:
        st.caption("Search assistant offline: start Ollama for smarter search. Typed text is "
                   "still matched without it.")


def footer() -> None:
    """Attribution at the bottom of every page."""
    st.html(
        '<footer style="margin-top:48px;padding:16px 0 8px;border-top:1px solid var(--sw-border);'
        'text-align:center;font-size:0.8rem;color:var(--sw-muted)">'
        'SafeRoute Madrid · ODKG Group 11<br>'
        'Accident data: <a href="https://datos.madrid.es" target="_blank">Ayuntamiento de Madrid</a>, '
        'CC BY 4.0 · Streets: © <a href="https://www.openstreetmap.org/copyright" target="_blank">'
        'OpenStreetMap</a> contributors, ODbL</footer>')


if not pipeline.is_built() and current.title not in ("Linked data", "Options"):
    st.warning("The data has not been built yet. Run `python scripts/build.py` once, or add CSV "
               "files in **Options**.")
    footer()
    st.stop()

current.run()
footer()
