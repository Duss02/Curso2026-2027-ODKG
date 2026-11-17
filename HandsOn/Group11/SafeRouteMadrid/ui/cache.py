"""Streamlit caches shared by the pages. `clear()` after a rebuild."""
from __future__ import annotations

import json

import pandas as pd
import streamlit as st

from safeway import config, geocode, pipeline, rdf, scenario, settings


@st.cache_resource(show_spinner="Loading the Madrid street network…")
def model(profile: str):
    return pipeline.load_model(profile)


@st.cache_data(show_spinner=False, max_entries=500)
def resolve(text: str, use_llm: bool = True):
    """Typed start/destination -> matches (local LLM + offline OSM index)."""
    return geocode.resolve(text, use_llm=use_llm)


@st.cache_resource(show_spinner="Opening the triplestore…")
def store():
    return rdf.open_store()


@st.cache_data(show_spinner=False)
def meta() -> dict:
    return json.loads((config.PROCESSED_DIR / "meta.json").read_text(encoding="utf-8"))


@st.cache_data(show_spinner=False)
def accidents() -> pd.DataFrame:
    return pd.read_parquet(config.PROCESSED_DIR / "accidents.parquet")


def user_settings() -> settings.Settings:
    """Read on every run (tiny JSON), so changes on the Options page apply immediately."""
    return settings.load()


def clear() -> None:
    model.clear()
    resolve.clear()
    meta.clear()
    accidents.clear()
    scenario._snapped.cache_clear()
    scenario._meta.cache_clear()
    geocode._index.cache_clear()
