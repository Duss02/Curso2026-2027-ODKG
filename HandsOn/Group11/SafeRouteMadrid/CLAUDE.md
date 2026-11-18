# SafeRoute Madrid: context for Claude Code

A local Streamlit app that finds the safest route between two points in Madrid, from traffic
accident CSVs turned into RDF. It is the ODKG Group 11 project:
<https://github.com/alexiamuresanpop/Curso2026-2027-ODKG/tree/master/HandsOn/Group11>.
Read README.md for the pipeline and the risk model.

## Commands

- `.venv\Scripts\python scripts\build.py`: ingest new or changed CSVs from `data/raw/`, then
  rebuild the risk model. `--force` re-processes everything; `--skip-ingest` only rebuilds the
  risk.
- `.venv\Scripts\streamlit run app.py`: run the app.
- `.venv\Scripts\python -m pytest`: run the tests (fast; they use temporary data folders).

## Rules

- **RDF must stay identical to the group's.** The output must keep matching the group's published
  RDF triple for triple. Any change to `safeway/clean.py`, `safeway/enrich.py` or
  `mappings/saferoute.rml.ttl` changes the RDF, so check it against the group's
  `rdf/saferoute_*_with-links_part_*.ttl`.
- **The app reads only `data/processed/` and the street pickles.** SPARQL runs at build time and
  on the Linked data page.
- **One process at a time on the store.** Oxigraph (`data/store/`) allows a single process, so
  never run the build while the app is open.
- **Python 3.12.** morph-kgc pins pyoxigraph to 0.3.x, whose API differs from 0.4.
- **Streets come from the BBBike OSM extract** (`safeway/streets.py`), not Overpass, which is
  often overloaded. The filters are OSMnx's own, applied with pyosmium.
- **Parameters** (vehicle profiles, severity weights, detour cap, levels) live in
  `safeway/config.py`.
- **The LLM only interprets search text.** `safeway/llm.py` (Ollama, `qwen2.5:3b`) turns typed
  text into {street, number, place}; `safeway/geocode.py` matches that against the OSM index in
  `data/processed/`. Never let the LLM produce coordinates. Without Ollama, the rules fallback
  must keep working.
- **App text is English;** the data values stay in Spanish.
