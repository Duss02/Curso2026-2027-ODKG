# Traffic Accident Explorer — desktop demonstration

Group01's academic application explores historical accidents in a **subset of New
York**, using **React → FastAPI → SPARQL → GraphDB**. All accident data, statistics,
details and concentration counts come from GraphDB. OpenStreetMap supplies only
basemap tiles. There is no secondary database, CSV lookup, per-request Turtle
parsing, live Wikidata API or fallback accident dataset.

**GraphDB must be running to retrieve or refresh accident data.** Previously loaded
UI results may remain visible, but they are not an offline data source.

## Docker Compose (Windows PowerShell)

The frontend and FastAPI run in Linux containers. **GraphDB Desktop remains on
Windows**, with the existing `group01-accidents` repository and its imported RDF.
This deployment does not containerize, replace or copy your GraphDB installation
or repository. GraphDB must be running; no data is bundled into either image.

Requirements: Docker Desktop running with its Linux/WSL2 engine, GraphDB Desktop
running on port 7200, and internet access for image/dependency downloads and map
tiles. Local Python and Node are unnecessary for this deployment.

Stop your manually started FastAPI and Vite terminals with Ctrl+C first: Docker
publishes the same ports, 8000 and 5173. Keep GraphDB running.

From a PowerShell terminal:

```powershell
Set-Location 'C:\Users\adolf\Desktop\Master\Open Data and Knowledge Graphs\2026-2027-ODKG\HandsOn\Group01\app'
docker version
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 backend frontend
Start-Process 'http://localhost:5173'
```

Open <http://localhost:5173> for the app, <http://localhost:8000/docs> for FastAPI,
and <http://localhost:7200> for GraphDB Workbench. The frontend is a production
Vite build served by unprivileged Nginx, rather than a development server. Nginx
forwards `/gateway/api/...` to FastAPI over the Compose network. The browser uses
the same origin, so the existing development CORS configuration stays unchanged.
FastAPI reaches Windows using Docker Desktop's `host.docker.internal` hostname;
`localhost` inside the backend container would refer to that container instead.

Optional configuration: copy `app/.env.example` to `app/.env` and change
`GRAPHDB_ENDPOINT` or `GRAPHDB_TIMEOUT_SECONDS`. This Compose environment is
separate from `backend/.env` and `frontend/.env`; local environment files and
virtual environments are excluded from image builds. Shell environment variables
override Compose `.env` values. The frontend API URL is a build argument fixed to
`/gateway` in Compose; it contains no credentials.

Verify both the direct API and the actual Nginx-to-FastAPI-to-GraphDB path:

```powershell
Invoke-RestMethod 'http://localhost:8000/api/health'
Invoke-RestMethod 'http://localhost:5173/gateway/api/health'
Invoke-RestMethod 'http://localhost:5173/gateway/api/statistics/severity' | Format-Table
Invoke-RestMethod 'http://localhost:5173/gateway/api/accidents?limit=2'
Invoke-RestMethod 'http://localhost:5173/gateway/api/hotspots?severity=1'
```

Health executes a real SPARQL query. Reference severity counts remain
9 / 17,900 / 3,309 / 481; they are not image fixtures. Backend health becomes
unhealthy if GraphDB cannot be queried. The frontend starts independently of
GraphDB health so it can display connection errors and recovery controls.
An unhealthy status does not automatically restart a running container.

```powershell
# Follow logs (Ctrl+C exits log following without stopping containers):
docker compose logs -f
# Rebuild after source changes; there are no development bind mounts:
docker compose up --build -d
# Stop and remove application containers/network; GraphDB data is untouched:
docker compose down
```

If Docker reports a missing `dockerDesktopLinuxEngine` pipe, open Docker Desktop
and wait until its Linux engine is ready. If ports are occupied, stop the old
local servers. If health fails, inspect backend logs and verify that GraphDB is
running, the repository exists, and Windows firewall permits Docker Desktop to
reach port 7200. This configuration targets Docker Desktop; a standalone Linux
engine needs separate host networking configuration.

Docker files: `compose.yaml`, root `.env.example`/`.gitignore`, each service's
`Dockerfile`/`.dockerignore`, and `frontend/nginx.conf`. Images contain application
code only, with no academic RDF/CSV files or host GraphDB volume mounts.

Validation for this addition: Compose configuration was validated. At validation
time the Docker CLI was installed but its Linux engine was not running, so image
builds, container health and the container-to-GraphDB path could not be tested.
The earlier Phase 4 live checks below describe the local deployment, not Docker.

## Desktop scope

The application is exclusively for desktop browsers. The dashboard was checked at
1920×1080, 1440×900 and 1366×768. Resizing preserves the desktop layout; the map
invalidates its size and provides a fit-extent control. Vertical page scrolling
and a scrollable detail inspector are intentional. The minimum layout width is
1100 px. Phone layouts, touch optimization, mobile navigation and mobile-device
tests are explicitly excluded. No mobile-specific breakpoints remain.

## Requirements and setup

- Existing GraphDB Desktop installation and Java 11 setup, unchanged.
- Python 3.12.
- Node.js 22.14+ and npm.
- Internet access for OpenStreetMap tiles.
- A current desktop browser supporting `AbortSignal.timeout` and `AbortSignal.any`.

### 1. Start GraphDB

Open the existing GraphDB Desktop installation and use its normal server start
controls. Open <http://localhost:7200> and select **group01-accidents**. Keep an
already running server rather than launching another one on the same port.

If the repository has not been populated, import the existing academic artifact
`HandsOn/Group01/rdf/accidents-with-links.ttl` once through Workbench's RDF import
workflow. The app never creates, imports, clears or updates repositories. No
changes to Java, `JAVA_HOME` or GraphDB Desktop configuration are needed.

### 2. Start FastAPI — PowerShell terminal 1

Starting from the repository root:

```powershell
Set-Location .\HandsOn\Group01\app\backend
if (-not (Test-Path .venv)) { py -3.12 -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn traffic_api.main:app --host 127.0.0.1 --port 8000 --reload
```

Stop an older backend process before restarting it on port 8000. A process started
without reload retains its old API until restarted. API docs:
<http://localhost:8000/docs>.

Backend `.env`, resolved relative to the backend directory:

```dotenv
GRAPHDB_ENDPOINT=http://localhost:7200/repositories/group01-accidents
GRAPHDB_TIMEOUT_SECONDS=15
```

Process environment variables take precedence. The lifespan-managed HTTPX client
uses a 3-second connection timeout and configurable read/write/pool timeouts. It
bypasses proxy environment settings for predictable local access. This local
setup assumes GraphDB permits these read queries without authentication. Queries
use `infer=false`; no arbitrary-query or write API is exposed.

### 3. Start React — PowerShell terminal 2

Starting from the repository root in a new terminal:

```powershell
Set-Location .\HandsOn\Group01\app\frontend
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open **<http://localhost:5173>**. Port 5173 is strict; stop an older Vite instance if
necessary. CORS allows that exact origin, not `http://127.0.0.1:5173`.

Frontend `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

The same addresses work as defaults without `.env`. Restart Vite after changing
its environment; production bundles require rebuilding. Never put secrets in
browser-visible `VITE_*` variables. Stop the application servers with Ctrl+C.

## Minimal structure

```text
app/
  README.md
  backend/
    .env.example, .gitignore, requirements.txt, pytest.ini
    README.md
    traffic_api/
      main.py       # FastAPI lifecycle, CORS and error handler
      config.py     # Environment settings
      graphdb.py    # One reusable asynchronous SPARQL HTTP client
      models.py     # Filters and validated API response models
      queries.py    # Shared core/filter pattern and bounded SELECT queries
      service.py    # RDF binding conversion and result validation
      routes.py     # Read-only HTTP endpoints
      __init__.py
    tests/
      test_api.py, test_phase3.py, test_hotspots.py
      test_integration.py
  frontend/
    .env.example, .gitignore
    package.json, package-lock.json
    index.html, tsconfig.json, vite.config.ts, vitest.config.ts
    public/favicon.svg
    src/
      main.tsx, App.tsx, styles.css
      api.ts, types.ts, data.ts
      hooks/useAccidents.ts
      components/
        AccidentMap.tsx, AccidentDetails.tsx, Filters.tsx
        Statistics.tsx, Icon.tsx
      App.test.tsx, api.test.ts
```

One typed frontend fetch client talks to one FastAPI API. Presentation, HTTP
routes, SPARQL construction, GraphDB communication and model validation stay
separate. There is no global state framework or extra service infrastructure.
Test fixtures exist only in tests; they are not fallback application records.

## Available endpoints

| GET endpoint | Response / purpose |
|---|---|
| `/api/health` | Lightweight actual SPARQL execution; not a completeness check |
| `/api/dataset` | Unfiltered RDF start-time range and geographic bounds |
| `/api/statistics/severity` | `{severity, count}[]` over the entire filtered population |
| `/api/accidents` | `{items, limit, offset}` for bounded, ordered marker pages |
| `/api/accidents/{accident_id}` | Available RDF detail for a validated stable ID; 404 if absent |
| `/api/hotspots` | `{cell_size_degrees, cells, total, max_count}` for the complete filtered grid |

Listing fields remain `id`, `uri`, `latitude`, `longitude`, `severity`, `start_time`
and nullable `street_name`. Detail adds nullable `end_time`, `description`,
`has_traffic_signal`, `street_uri`, `street_wikidata_uri`, `city`, `state`, `country`.
Missing fields remain null; false traffic-signal values correctly display **No**.
No unavailable RDF values are reconstructed from CSV.

`/api/dataset` supplies `start_time`, `end_time` (the latest accident **start**),
`south`, `north`, `west`, `east`. Empty-graph metadata is null. It drives the date
limits, coverage label and map bounds without illustrative hardcoded dates.

### Filters and pagination

The same validated filters apply to statistics, markers and hotspots:

| Parameter | Behavior |
|---|---|
| `severity=1&severity=3` | OR within selected levels 1–4; at most four values |
| `start_date=2021-01-01` | Accident start at or after local midnight |
| `end_date=2021-12-31` | Includes the whole selected end calendar day |
| `street=broad` | Case-insensitive literal substring of the RDF street name |
| `limit=500&offset=0` | Listing only: limit 1–1000, offset 0–1,000,000 |

Filter categories combine with AND. Omitted severity means all levels. The UI
defaults to all four and requires at least one selected level. Reset restores
the unfiltered population. Blank street text imposes no street restriction;
nonempty search excludes records that have no matching street label. No postcode
or county filter is offered because those properties are absent from the RDF.

Dates use timezone-less local dataset times. The inclusive end boundary is
`< next-day midnight`, preserving fractional seconds without UTC conversion.
Reversed ranges, invalid dates/severities, searches longer than 120 characters,
invalid paging and end date 9999-12-31 return HTTP 422. Search text is escaped as
a SPARQL string literal; IDs are validated before being used in a fixed URI pattern.

Filter edits remain drafts until **Apply filters**. No request is made on each
street keystroke, so search needs no debounce timer. Applying unchanged filters
does not repeat requests. Applying new filters cancels obsolete requests, clears
selection and resets both layers. Stable URI ordering and deduplication prevent
page overlap. Reads are not a transaction snapshot if GraphDB changes between calls.

## Marker and concentration modes

**Accident markers** requests 500 records initially, then one page per Load more
click. Browser marker loading is capped at 5,000 and clearly disclosed. Clustering,
chunked loading and removal of offscreen marker DOM keep the map manageable.
Individual numbers/colors represent severity; cluster numbers count loaded points.
The Markers loaded statistic describes the paginated layer, not all matching
accidents and not the current viewport. Accident details load separately by ID.

**Concentration grid** queries `/api/hotspots` on demand. GraphDB applies the same
core patterns and active filters, then groups by:

```sparql
BIND(FLOOR(?latitude / 0.005) AS ?latBin)
BIND(FLOOR(?longitude / 0.005) AS ?lngBin)
```

Each cell counts distinct accident IDs. Bins are anchored at 0° and correctly use
floor for negative longitude. Cells are half-open angular intervals; returned
bounds use `bin * 0.005` and `(bin + 1) * 0.005`. This is approximately 556 m
north–south × 420 m east–west near New York, not an equal-area global grid.

The response contains only occupied cell bounds and counts. **All matching
accidents are represented**, including those without streets, regardless of
marker pagination. No sampling, marker-page truncation or separate stored dataset
is used. For the reference graph, 286 cells represent all 21,699 records.

Fixed count bands are 1–9, 10–49, 50–199, 200–999 and 1,000+. Darker cells contain
more recorded accidents. These bands remain comparable across filter changes.
Cell popups show counts. The visualization describes concentration, not predicted
risk, causation or an exposure-adjusted accident rate.

Grid rectangles render through Leaflet Canvas, avoiding thousands of path DOM
elements or a new heatmap dependency. The server permits at most 2,000 occupied
cells and requests one sentinel cell to detect overflow. Oversized results return
422 `hotspot_limit_exceeded` without a partial grid. The UI also rejects a grid
whose total differs from the current severity total and asks for a refresh.

Only the active layer is fetched after filter changes. Switching between already
loaded layers reuses the current filtered results. The map remains mounted while
another layer loads, preserving navigation. Selection clears when changing modes.
Refresh data discards the session's metadata/layer snapshot and queries GraphDB
again. This transient browser state is not an offline database.

## Accident details and Wikidata

Click a point or a loaded-record entry to retrieve `/api/accidents/{id}`. The
inspector displays the real ID, URI, severity, start/end time, street, coordinates,
description, traffic signal and geographic names when present. Missing values are
shown as Unknown street / Not recorded / No description available. The panel has
close and retry controls; changing selection cancels its obsolete request.

The optional **View on Wikidata** link follows `ao:locatedOn` then `owl:sameAs` in
GraphDB. A validated Wikidata entity URL opens in a new tab with
`noopener noreferrer`; absent links remain hidden. Local street identity is shown
independently. No hardcoded entity mapping or Wikidata API call is used.
Geographic names use the existing `https://schema.org/` terms.

## Reliability and performance

- Marker queries page core records before joining street labels. Descriptions and
  other full-detail fields are never fetched for marker pages.
- Statistics, marker pages and hotspot groups share one SPARQL filter builder.
- A single HTTPX pool is reused; failed GraphDB reads never fall back to records.
- Unfiltered date/extent metadata is reused within the browser session until
  explicit Refresh/Retry, rather than recomputed for every filter edit.
- Stable map props and memoization avoid reclustering when only details change.
- Only current-filter layer results are retained; stale responses are ignored.
- Initial duplicate development probes were removed with the redundant StrictMode
  entry wrapper; cancellation and concurrency remain covered by tests.

In one local warm-query comparison, three measured 500-record query runs had
median times of approximately 607 ms before and 469 ms after paging the street
join, with identical ordered bindings. This is a small local measurement, not a
general latency guarantee. The reference complete-grid response measured about
20 KB (286 cells).

GraphDB connection failures return 503, timeouts 504 and upstream HTTP/invalid
results 502. Invalid user parameters return 422, unknown accidents 404. Upstream
errors expose useful codes/messages, not raw diagnostic bodies. The app provides
loading, empty, initial/layer/page/detail error and retry states. Map tile failures
are distinct from accident-data failures. GraphDB must be running for new reads.

## Academic demonstration — FR1 through FR7

| Requirement | Demonstration |
|---|---|
| FR1 | Open Accident markers; zoom into a cluster and inspect real coordinates |
| FR2 | Select only severity 1 and Apply: nine matches; try multiple levels |
| FR3 | Select a single start/end date, e.g. 2023-03-23; the full day is included |
| FR4 | Search partial mixed-case `bRoAd`; combine it with dates/severity |
| FR5 | Click a real marker; close/reopen its inspector |
| FR6 | Inspect start/end, description, coordinates, signal and geographic names |
| FR7 | Switch to Concentration grid; compare its complete total with statistics |

Useful reference scenarios: severities 2/3 + year 2021 + street `bRoAd` gives
20 matches in the current graph. Severity 2 on 2023-03-23 gives seven matches;
record `A-3665570` has no street and no Wikidata link. A Broadway result such as
`A-1083885` has an optional Wikidata street link. These are demonstration
references, never hardcoded API responses. Search `no-such-street-xyz` for an empty
state, then Reset. Resize the desktop window and use Fit dataset extent if needed.

Verify the API from PowerShell while GraphDB and FastAPI are running:

```powershell
Invoke-RestMethod 'http://localhost:8000/api/health'
Invoke-RestMethod 'http://localhost:8000/api/statistics/severity' | Format-Table
$grid = Invoke-RestMethod 'http://localhost:8000/api/hotspots'
$grid | Select-Object total, max_count, cell_size_degrees
$grid.cells | Measure-Object -Property count -Sum
Invoke-RestMethod 'http://localhost:8000/api/hotspots?severity=1'
$page = Invoke-RestMethod 'http://localhost:8000/api/accidents?limit=20&street=broad'
if ($page.items.Count -gt 0) {
    Invoke-RestMethod ('http://localhost:8000/api/accidents/' + $page.items[0].id)
}
```

## Build and tests

From `app/frontend`:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
# Optional: stop the dev server before previewing on the same allowed origin:
npm.cmd run preview
```

From `app/backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
# Real, read-only integration checks require the running reference GraphDB:
$env:RUN_GRAPHDB_INTEGRATION='1'
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
Remove-Item Env:RUN_GRAPHDB_INTEGRATION
.\.venv\Scripts\python.exe -m pip check
```

Mocked HTTP tests cover validation, filter construction, paging, details, links,
upstream failures, grid bounds/counts, overflow rejection, stale requests, view
caching and UI states. Live tests load the reference graph through the API and
independently verify every hotspot bin, all filter combinations and all reference
counts. Unavailable GraphDB fails an explicitly enabled integration run; it is not
silently reported as success. Browser failure simulation does not stop or modify
GraphDB and is distinguished from real GraphDB checks. No mobile tests are run.

## Known dataset and operational limitations

The reference graph has 21,699 accidents: severity counts 9 / 17,900 / 3,309 / 481.
There are 21,603 records with streets, 96 without, 538 local streets and 60 linked
local street resources. Those links target 53 distinct Wikidata entities and
cover 929 accidents. Link presence does not certify reconciliation correctness.

Coverage is a historical New York subset, not demonstrably all NYC boroughs.
Recorded start times span March 2016 to March 2023. Severity is an ordinal dataset
scale, not injuries/fatalities. The current RDF has one core coordinate pair per
accident; arbitrary multi-location replacement graphs are outside this demo's
model. Counts are not traffic-exposure-adjusted risk. The grid is angular, and
the 2,000-cell bound intentionally limits larger replacement datasets.

Source: US Accidents by Sobhan Moosavi et al. The academic documentation declares
CC BY-NC-SA 4.0 for derived data; verify original terms before publication. The
existing non-fatal Starlette TestClient deprecation warning remains. No prediction,
live incidents, authentication, additional database or mobile application is added.

## Cleanup record

The audit found every application module, endpoint, asset and declared dependency
in use. The clustering peer packages/types and useful tests/configuration were
retained. **No dependencies were added or removed.** No academic deliverable was
changed; no commit, push or PR is created.

Initial cleanup removed 13 stale generated files: five old bundle files under
`frontend/dist/`, two screenshots under `frontend/output/` and six browser logs/
snapshots under `frontend/.playwright-cli/`. It also removed five phone/tablet
breakpoint rules and the touch-highlight rule. Obsolete responsive instructions,
unused badge/popup CSS and marker-only wording were removed. The unused
`distribution`/`street-filter` classes and duplicate empty-state Refresh button
were removed. Current setup documentation is consolidated here.

The second cleanup pass checks imports, dependencies, temporary artifacts, CSS,
documentation and scope again. Generated browser-debug artifacts are removed
after verification. `dist/` is regenerated by the production build for optional
local preview and remains ignored, as do `.env`, `.venv`, `node_modules`, Python
caches and test outputs. No temporary benchmark script or accident fixture is
added to application runtime code.

### Final verification — 27 October 2026

- TypeScript checks and production build passed; 28 frontend tests passed.
- Backend: 90 mocked HTTP tests and 13 real GraphDB checks passed, 103 total.
  `pip check` and the installed npm dependency tree checks passed.
- Real GraphDB checks preserved all stated reference counts and independently
  matched every occupied grid cell for the unfiltered dataset and filter scenarios.
- Desktop browser checks at 1920×1080, 1440×900 and 1366×768 confirmed no horizontal
  overflow. Real marker selection, missing-street details, Wikidata details,
  combined filters, empty results, both modes and loading 1,000 markers worked.
- A browser-only simulated 503 showed the GraphDB error without fallback data;
  removing the simulation and retrying restored the real complete grid. GraphDB
  itself was not stopped or modified. No mobile compatibility tests were run.
- The second cleanup removed three verification screenshots and six browser
  logs/snapshots. Together with the initial pass, 22 obsolete/generated files were
  removed. Application source was formatted for readability; no formatter was
  added as a project dependency. The final scan found no unreferenced custom CSS
  or application console debugging calls.
- SHA-256 checks confirmed all 28 existing files outside `app/` were unchanged;
  no files were added outside it. No commit, push or Pull Request was created.

Implementation references: [SPARQL 1.1](https://www.w3.org/TR/sparql11-query/),
[Leaflet Canvas options](https://leafletjs.com/reference),
[React Leaflet](https://react-leaflet.js.org/docs/start-setup/), and
[Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).
