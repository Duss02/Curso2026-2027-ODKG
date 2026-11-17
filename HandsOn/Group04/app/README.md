# Breathe & Play Madrid – application

Web application (Streamlit) over the knowledge graph of Hands-on 6, published in
GraphDB. Every value shown comes from a SPARQL query (`queries.py`): over our graph, or
over Wikidata, following the `owl:sameAs` links of our districts and neighbourhoods.

| Page | What it shows | Requirements (applicationRequirements.html) |
|---|---|---|
| **Mapa** | The 607 sports facilities on a map, coloured by the air quality measured on the chosen day at their nearest monitoring station; filters by type, district and accessibility; the 24 stations | FR1, FR2, FR3, FR9 |
| **Ficha de la instalación** | Data of a facility, its nearest station, the district and neighbourhood in Wikidata, and the daily values of a pollutant in 2024 with the days above the reference value | FR4, FR5, FR8, FR9 |
| **Distritos** | Facilities, inhabitants and area (from Wikidata), facilities per 10,000 inhabitants and mean value of a pollutant per district, and the facilities of a type with the cleanest air | FR6, FR7, FR8 |

**Benefits of linked data shown in the app.** The data of three different datasets of
the City Council (air quality, stations, sports facilities) is queried together
because they share resources (stations, districts) and vocabularies (EDINT, SOSA).
The links to Wikidata add what the City Council data does not have: the description
of the district and neighbourhood of each facility (Ficha) and the population and
area of each district (Distritos), so the app can compute facilities per 10,000
inhabitants.

The source and licence of the data (CC BY 4.0, Madrid City Council) are shown on every
page (FR10).

Air quality categories: daily mean ≤ reference value → *Bueno*, ≤ 2 × reference →
*Moderado*, above → *Malo*. Reference values: WHO Air Quality Guidelines 2021, 24-hour
values (NO2 25, PM10 45, PM2.5 15, SO2 40 µg/m³, CO 4 mg/m³; for O3, 100 µg/m³ is an
8-hour value used as an approximation). They are in `queries.py` (`REFERENCE`). Values
marked as not valid by the City Council are not used.

## Files

| File | Content |
|---|---|
| `app.py` | Entry point and navigation |
| `mapa.py`, `ficha.py`, `distritos.py` | The three pages |
| `queries.py` | SPARQL queries (EDINT, SOSA, OWL-Time… vocabulary) and reference values |
| `data.py` | Runs the queries: GraphDB endpoint, or the RDF files loaded locally with pyoxigraph if GraphDB is not running |
| `common.py` | Shared helpers (air quality categories, Wikidata, footer) |
| `requirements.txt` | Python libraries |

## Run

1. Start GraphDB with the repository `breatheplay` (the published graph: the three
   `rdf/*-reuse.ttl` files, `ontology/breatheplay-kos.ttl` and
   `ontology/breatheplay-reuse.ttl`).
2. Use a separate Python environment (the version of pyoxigraph used here is newer
   than the one Morph-KGC needs). With Anaconda:

```
conda create -n bpm-app python=3.12
conda activate bpm-app
cd HandsOn/Group04
pip install -r app/requirements.txt
streamlit run app/app.py
```

The browser opens at http://localhost:8501. The footer of the sidebar says which
source is being used. The map, the Wikidata descriptions and the population of the
districts need an internet connection.

The app queries `http://localhost:7200/repositories/breatheplay`. If GraphDB is not
running, it loads the same files in memory with pyoxigraph (a few seconds), so it also
works without GraphDB. Another endpoint can be given in the variable
`BPM_SPARQL_ENDPOINT` (`local` always uses the files):

```
set BPM_SPARQL_ENDPOINT=http://localhost:7200/repositories/other      (Windows)
export BPM_SPARQL_ENDPOINT=http://localhost:7200/repositories/other   (Linux/Mac)
```
