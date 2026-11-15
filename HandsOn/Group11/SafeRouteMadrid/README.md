# SafeRoute Madrid

A local app that finds the safest route between two points in Madrid. It uses the city's
traffic-accident open data, published as Linked Data. The app works with any number of yearly CSV
files: the 2025 and 2026 files are included, and other years can be added.

This is the application for the ODKG 2026–2027 hands-on project, Group 11:
<https://github.com/alexiamuresanpop/Curso2026-2027-ODKG/tree/master/HandsOn/Group11>.
SafeRoute Madrid reuses that project's cleaning steps, RML mapping, ontology, Wikidata links and SPARQL
queries.

## Getting started (Windows, Python 3.12)

```powershell
py -3.12 -m venv .venv          # or: uv venv --python 3.12 .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python scripts\build.py        # first run: about 10 minutes, needs internet once
.venv\Scripts\streamlit run app.py           # http://localhost:8501
```

The first build downloads the OpenStreetMap extract of Madrid (BBBike, about 80 MB) and the
municipal boundary. After that, the app and later builds work offline.

### Search assistant (local AI, optional)

Start and destination are typed freely: "calle alcala 100", "c/ goya 46", "castellana", "near
the bernabeu", "atocha station". A small local LLM, run by [Ollama](https://ollama.com), reads
the text as a street, house number or landmark. SafeRoute Madrid then finds that in an offline index built
from the same OpenStreetMap extract: 123,000 addresses with house numbers, 7,500 named places and
8,600 streets. Typos and missing accents are tolerated. The LLM never makes up coordinates:
every result is a real OSM address, street or place, and nothing you type leaves your computer.

```powershell
winget install Ollama.Ollama
ollama pull qwen2.5:3b          # about 2 GB, once
```

Without Ollama, the search box still works with simple rules ("street number").

### Map tiles (optional CARTO key)

Without a key, the maps use the standard OpenStreetMap tiles. To use the lighter CARTO Positron
style:
1. Request a free key at <https://carto.com/basemaps/apikey>. No account is needed, and it is free
   for non-commercial use up to 5 million tiles a month.
2. Create `.streamlit\secrets.toml` with:

   ```toml
   CARTO_API_KEY = "your-key"
   ```

The file is ignored by git, so the key is never committed. Setting the `CARTO_API_KEY` environment
variable works too.

### Email notifications (optional)

Under **Options → Personal settings → Email notifications** you can turn on emails for a route
summary after each **Calculate route**, and for when a data rebuild finishes. The Plan page also
gets an **Email this route** button. Mail is sent through your own SMTP server, set in
`.streamlit\secrets.toml`:

```toml
[smtp]
host = "smtp.gmail.com"
port = 587                     # 465 = SSL, anything else = STARTTLS
user = "you@gmail.com"
password = "your-app-password" # for Gmail, an App Password, not your normal password
sender = "you@gmail.com"       # optional, defaults to user
```

The `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_SENDER` environment variables
work too. Notifications are off by default, and without an SMTP server the app works the same.

Route emails include a picture of the map (`ui/static_map.py`): the risk-coloured route, the
safer alternative, the accident-risk locations and the start and end, drawn over CARTO tiles
(OpenStreetMap without a key). If the tiles cannot be downloaded the map still comes out on a plain background.

## What the app does

- **Plan a route** follows the group's three mock-ups:
  - **Trip configuration:** type a start and a destination (an address, street or landmark,
    understood by the local search assistant) and choose a vehicle type (car, motorcycle,
    heavy vehicle, bus or bicycle).
  - **Route overview with hazard warnings:** the fastest route, with each street coloured by its
    accident history and warning markers at accident-risk locations. Each marker shows the street,
    the risk level, the number of accidents, how many involved your type of vehicle, serious or
    fatal injuries, and the most common accident type.
  - **Alternative route comparison:** a safer alternative with its distance, time, history level
    and number of risk locations. You can select it or keep the original.
- **What if…?** asks about a hypothetical trip in plain words, for example "what if it rains on a
  Saturday night and Gran Vía is closed?" or "what if I go by motorbike?".
  - **How a question is read:** the local AI turns it into scenario settings you can review and
    edit: vehicle, weather, time of day, weekday or weekend, closed streets, avoiding motorways,
    detour tolerance and how hard to avoid risk. Weather, time and day only change if the
    question mentions them.
  - **How the scenario is computed:** SafeRoute Madrid rebuilds the street risk from only the accidents
    recorded under those conditions. It compares the result with your usual trip, measuring both
    against Madrid under the same conditions, so night is not "safer" just because fewer people
    travel then.
  - **Best time of day:** it also ranks the four time bands for that trip. When few accidents
    match a condition, the app says the result is indicative.
- **Accident hotspots:** a map and ranking of Madrid's riskiest street segments for each vehicle
  type.
- **Linked data:** the loaded CSV files and their named graphs, the SPARQL query the app uses,
  the group's validation queries, and a free SPARQL editor.
- **Options:**
  - **Accident data:** upload more CSV files, re-process or remove files, and rebuild.
  - **Personal settings:** default vehicle, default start and destination, how hard the safer
    route avoids accident history, longest detour accepted, avoiding motorways, map style, and
    AI search on or off.
  - **Where they're kept:** settings are saved in `data/settings.json`, which is not in git.

## Data pipeline

```
data/raw/*.csv              Madrid portal files (any year; ';' or ',', raw or already cleaned)
  │ safeway/clean.py        the group's OpenRefine history.json (53 operations), in Python
  │ safeway/enrich.py       UTM 30N → WGS84 (pyproj) + Wikidata links (data/links/wikidata_lookup.csv)
  ▼
data/clean/<file>.csv
  │ safeway/rdf.py          mappings/saferoute.rml.ttl (the group's with-links RML) with morph-kgc
  ▼
data/rdf/<file>.nt          ──► Oxigraph store, data/store/, one named graph per CSV
                                + the ontology in <https://w3id.org/saferoutemadrid/graph/ontology>
  │ queries/accidents.sparql
  ▼
safeway/risk.py             accidents snapped to OSM street segments, risk per vehicle type
data/processed/             accidents, segment risk and thresholds read by the app
```

- **Faithful to the group's RDF:** the pipeline reproduces the group's published RDF exactly. For
  both 2025 (1,041,936 triples) and 2026 (626,557 triples), every triple in
  `rdf/saferoute_*_with-links_part_*.ttl` is generated, and nothing else.
- **Adding data:** put another CSV in `data/raw/` (or upload it on the Linked data page) and run
  `python scripts\build.py`. Only new or changed files are processed. Deleting a CSV removes its
  named graph. Files without the 19 Madrid columns are rejected with a message. If the same
  accidents appear in two files, the app warns about it.
- **One process at a time:** the store can be opened by only one process. Close the app before
  running `scripts\build.py`, or rebuild from the Linked data page instead.

## Risk model

1. **Where accidents count.** Each accident is attached to its nearest street segment, up to 40 m
   away. Both directions of a street share one segment.
2. **How much each accident weighs.** An accident's weight is the severity of its worst injury
   (fatal 10, hospitalised more than 24 h 5, other assistance 1.2–2, none 1). For the selected
   vehicle type, this is multiplied by 1 if a vehicle of that type was involved, or by 0.35
   otherwise.
3. **Fastest and safer routes.** The fastest route minimises OSM travel time. The safer route adds
   one minute per unit of risk on each segment. If that alternative is more than 1.6 times longer
   than the fastest route, the penalty is halved until it fits; if no alternative fits, none is
   offered.
4. **Risk level.** A route's level compares its risk per km with the Madrid average: Low below
   1.5×, Medium below 3×, High from 3×.
5. **Hotspots.** A hotspot is a segment with at least 5 accidents and a risk in the top 25% of
   such segments. It is rated High in the top 5%.

All parameters are in `safeway/config.py`.

**Limitation:** this is historical accident density, not a prediction. Busy avenues carry more
traffic and so collect more accidents, and the data has no traffic volumes to correct for this.
Passengers who appear before any driver in an accident have no vehicle in the mapping, as in the
group's RDF, so their injuries do not count toward the severity.


## Tests

```powershell
.venv\Scripts\python -m pytest
```

## Licences

- **Accident data:** Ayuntamiento de Madrid (Policía Municipal), CC BY 4.0. The generated RDF is
  also CC BY 4.0.
- **Streets:** © OpenStreetMap contributors, ODbL.
