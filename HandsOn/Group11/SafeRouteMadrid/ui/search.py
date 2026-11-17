"""Free-text location box shared by Plan a route and What if."""
from __future__ import annotations

import streamlit as st

from ui import cache

ICONS = {"address": "🏠", "street": "🛣️", "place": "📍"}


def _how(parsed: dict) -> str:
    """One line telling the user how their text was read."""
    if not parsed:
        return ""
    what = parsed.get("place") if parsed.get("kind") == "place" else \
        " ".join(x for x in (parsed.get("street"), parsed.get("number")) if x)
    who = "🤖 AI (local)" if parsed.get("source") == "llm" else "Text rules"
    return f"{who} read this as {parsed.get('kind', 'street or place').replace('_', ' ')}: *{what}*"


def location_input(label: str, default: str, key: str):
    """Text box -> best matches in Madrid -> the chosen (label, (lat, lon)), or None."""
    text = st.text_input(label, default, key=f"{key}_text",
                         placeholder="Street and number, square, station, landmark…")
    if not text.strip():
        return None
    with st.spinner("Searching Madrid…"):
        matches, parsed = cache.resolve(text, cache.user_settings().ai_search)
    if not matches:
        st.warning(f"Nothing in Madrid matches “{text}”. Try a street name, a number or a landmark.")
        return None
    labels = [f"{ICONS[m.kind]} {m.label}" for m in matches]
    choice = st.selectbox(f"{label} match", labels, key=f"{key}_match_{text}", label_visibility="collapsed")
    st.caption(_how(parsed))
    m = matches[labels.index(choice)]
    return m.label, (m.lat, m.lon)
