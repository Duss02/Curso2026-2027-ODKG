"""Typed-location search on a tiny index; the LLM is replaced by fixed answers."""
import pandas as pd
import pytest

from safeway import geocode, llm


@pytest.fixture
def index(monkeypatch):
    addresses = pd.DataFrame({
        "street": ["Calle de Alcalá", "Calle de Alcalá", "Calle de Alcalá", "Paseo del Prado", "Calle del Prado"],
        "number": ["98", "100", "101", "8", "8"],
        "lat": [40.42, 40.4201, 40.4202, 40.41, 40.415], "lon": [-3.68, -3.6801, -3.6802, -3.69, -3.698]})
    addresses["key"] = addresses["street"].map(geocode.normalize)
    addresses["num"] = pd.to_numeric(addresses["number"])
    places = pd.DataFrame({"name": ["Estadio Santiago Bernabéu", "Puerta del Sol"],
                           "kind": ["leisure=stadium", "place=square"],
                           "lat": [40.453, 40.417], "lon": [-3.688, -3.703]})
    places["key"] = places["name"].map(geocode.normalize)
    streets = pd.DataFrame({"street": ["Calle de Alcalá", "Paseo del Prado", "Calle del Prado", "Calle de Goya"],
                            "lat": [40.42, 40.41, 40.415, 40.424], "lon": [-3.68, -3.69, -3.698, -3.679]})
    streets["key"] = streets["street"].map(geocode.normalize)
    geocode._index.cache_clear()
    monkeypatch.setattr(geocode, "_index", lambda: (addresses, places, streets))


def test_normalize_drops_street_type_accents_and_stopwords():
    assert geocode.normalize("C/ de Alcalá") == "alcala"
    assert geocode.normalize("Pº del Prado") == "prado"
    assert geocode.normalize("Avenida de la Albufera") == "albufera"


def test_address_with_typos_and_no_accents(index, monkeypatch):
    monkeypatch.setattr(llm, "interpret", lambda text: None)          # Ollama not running
    matches, parsed = geocode.resolve("calle alcala 100")
    assert parsed["source"] == "rules"
    assert (matches[0].label, matches[0].kind) == ("Calle de Alcalá, 100", "address")


def test_missing_number_falls_back_to_nearest_on_the_same_side(index, monkeypatch):
    monkeypatch.setattr(llm, "interpret", lambda text: None)
    matches, _ = geocode.resolve("alcala 102")
    assert matches[0].label == "Calle de Alcalá, 100"                # even side, closest


def test_street_type_breaks_ties(index, monkeypatch):
    monkeypatch.setattr(llm, "interpret", lambda text: None)
    assert geocode.resolve("paseo prado 8")[0][0].label == "Paseo del Prado, 8"
    assert geocode.resolve("calle prado 8")[0][0].label == "Calle del Prado, 8"


def test_llm_interpretation_is_used_for_places(index, monkeypatch):
    monkeypatch.setattr(llm, "interpret", lambda text: {
        "kind": "place", "street": "", "number": "", "place": "Estadio Santiago Bernabéu"})
    matches, parsed = geocode.resolve("near the bernabeu stadium")
    assert parsed["source"] == "llm"
    assert matches[0].label == "Estadio Santiago Bernabéu" and matches[0].kind == "place"


def test_llm_cannot_invent_locations(index, monkeypatch):
    monkeypatch.setattr(llm, "interpret", lambda text: {
        "kind": "place", "street": "", "number": "", "place": "Torre Eiffel"})
    matches, _ = geocode.resolve("eiffel tower")
    assert all(m.label in {"Estadio Santiago Bernabéu", "Puerta del Sol", "Calle de Alcalá",
                           "Paseo del Prado", "Calle del Prado", "Calle de Goya"} for m in matches)


def test_interpret_returns_none_when_ollama_is_down(monkeypatch, tmp_path):
    import requests

    def down(*args, **kwargs):
        raise requests.ConnectionError("no server")

    monkeypatch.setattr(llm, "CACHE", tmp_path / "cache.json")
    monkeypatch.setattr(requests, "post", down)
    assert llm.interpret("gran via 1") is None
