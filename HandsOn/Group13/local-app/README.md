# Madrid Parking: find a historical alternative

**Choose a parking facility and a month. See its historical occupancy and compare other facilities in the same or bordering districts.**

This local web application is Group13's parking project, with a facility-first interface, a geographic occupancy map, and real RDF/SPARQL queries. It is not a live availability service or forecasting system.

The professor-reviewed [aparcamientos-with-links.ttl](../rdf/aparcamientos-with-links.ttl) remains the authoritative source of parking facts and is **never rewritten**. Separate snapshots supply Wikidata border relationships and verified municipal geography.

## Contents

1. [Run locally](#1-run-locally)
2. [Use the application](#2-use-the-application)
3. [What the occupancy values mean](#3-what-the-occupancy-values-mean)
4. [RDF and knowledge databases explained](#4-rdf-and-knowledge-databases-explained)
5. [The parking model](#5-the-parking-model)
6. [How Wikidata determines the alternatives](#6-how-wikidata-determines-the-alternatives)
7. [SPARQL and aggregation](#7-sparql-and-aggregation)
8. [Geographic reconciliation and the map](#8-geographic-reconciliation-and-the-map)
9. [Architecture and file guide](#9-architecture-and-file-guide)
10. [Refresh and reproducibility](#10-refresh-and-reproducibility)
11. [Data limitations and missing values](#11-data-limitations-and-missing-values)
12. [Troubleshooting](#12-troubleshooting)
13. [Assignment coverage and demonstration](#13-assignment-coverage-and-demonstration)
14. [Sources, licenses, and future extensions](#14-sources-licenses-and-future-extensions)

## 1. Run locally

### Requirements

- Windows with PowerShell 7.
- Node.js 22 or later: `node --version`.
- Java 21 or later: `java -version`.
- The containing Group13 folder, including its reviewed `rdf\aparcamientos-with-links.ttl` file.
- Internet for the initial Fuseki download, or when deliberately refreshing external snapshots.

There are no npm dependencies, frontend build step, Docker requirement, cloud account, or mandatory online map tiles. Leaflet 1.9.4 is vendored locally, together with its license.

### First setup, or reload after an update

From the cloned repository root, open PowerShell and enter the application directory, with the parking services stopped:

```powershell
Set-Location '.\HandsOn\Group13\local-app'
.\setup.ps1
```

The clone can live anywhere and its root folder can have any name. JavaScript resolves local files relative to its modules; PowerShell scripts resolve paths from their own directory. No user-specific absolute filesystem paths are required. The ignored `runtime` directory is created locally by setup and should not be committed or copied between clones.

Setup downloads standalone Apache Jena Fuseki 6.2.0 if necessary, checks the archive against Apache's SHA-512 checksum, starts a temporary loopback-only maintenance server, and imports three graphs:

1. The reviewed parking Turtle file, directly.
2. The included Wikidata snapshot.
3. The included verified parking-coordinate snapshot.

It verifies source identity coverage, reports source counts, records a SHA-256 integrity fingerprint, and stops its temporary server. Local district polygons are served as a visualization asset rather than loaded into the RDF store.

Existing users of the earlier application should also rerun setup: the geography graph is new.

### Start the services

Run a single launcher from the application directory:

```powershell
.\start.ps1
```

It starts `start-fuseki.ps1` and `start-app.ps1` as background PowerShell jobs and streams both services' output into this terminal. Wait for Fuseki's `Start Fuseki` message, then open **http://127.0.0.1:8080**.

**Press Ctrl+C in the launcher to stop both services and their child processes.** If either service fails, the launcher stops the other rather than leaving half the application running. On Windows, the workers and their native descendants belong to a kill-on-close job object: force-terminating the launcher process also stops its services. The existing PowerShell terminal is not enrolled in that object.

The launcher refuses occupied service ports; it never terminates an independently started server. Keep it running while using the app. It does not run first-time setup automatically.

For manual debugging, you can still start the services in separate terminals:

```powershell
.\start-fuseki.ps1
# In a second terminal:
.\start-app.ps1
```

In manual mode, stop each terminal with Ctrl+C yourself. Do not open the HTML directly from disk; the application needs its local API and RDF database.

| Port | Service |
|---|---|
| 8080 | Web page and read-only application API |
| 3030 | Normal Fuseki query service |
| 3031 | Temporary writable import service; setup only |

The normal parking dataset endpoint is query-only. Graph writes are performed only by the controlled maintenance/import process. All supplied services bind to loopback and are intended for local use, not deployment to an untrusted network.

### Optional settings

Use another web port:

```powershell
$env:PORT = '8081'
.\start.ps1
```

The Node server and refresh utilities accept `FUSEKI_QUERY_URL` when using a separately configured compatible Fuseki dataset. The supplied setup/start scripts retain their documented fixed Fuseki ports and database path.

```powershell
$env:FUSEKI_QUERY_URL = 'http://127.0.0.1:3030/parking/query'
```

The page defaults to a **white background with blue accents**, regardless of the operating system theme. Add `?clawpilotTheme=dark` for the optional dark background with blue accents, or `?clawpilotTheme=light` to explicitly select the default. The map's green/amber/red/gray occupancy markers are unchanged.

## 2. Use the application

### Step 1: choose your starting facility

The initial screen asks for a parking facility rather than displaying all observations. Facility choices come from SPARQL and include their recorded district names. A native select supports keyboard navigation and typing to jump to a name.

Choose a facility, a calendar month, and:

- **Average across recorded years**: the default year selection.
- **A specific year**: occupancy for that exact year/month.

The month initially follows the current calendar month. Changing the facility keeps your chosen month, year mode, and metric. An empty selection never silently becomes another period.

Two reviewed facilities, PLAZA DE COLON and PLAZA DE ESPANA (accented in the data), have more than one `locatedIn` district relationship. For these, an additional **district context** control appears. Choose a recorded district to establish an unambiguous comparison origin; the application does not silently correct the reviewed RDF.

### Step 2: read the selected-facility card

The card shows the chosen facility's occupancy, its district context, contributing observation count/years, excluded values, and capacity information.

- Average mode: capacity is a **range across contributing valid observations**, not an arbitrary current capacity.
- Exact-year mode: capacity belongs to that observation.
- No valid occupancy: explicitly shown as such, never as 0%.

### Step 3: inspect the map and alternatives

The map uses the same SPARQL result values as the lists. It is geographic, using municipal coordinates, not a diagram with invented positions.

The alternative lists are grouped:

- **Same district**: other facilities related to the selected local district.
- **Bordering districts**: facilities reached through Wikidata border relationships.

Within each group, valid alternatives are ordered by occupancy. Lower values are labeled in **percentage points**, not as a predicted improvement or probability.

If averages use different years, that difference is highlighted. Facilities without valid data appear separately, not in the ranked lists. Facilities without verified coordinates stay in the lists.

Click an alternative's name to preview its map popup. Click **Compare from here** to explicitly replace the starting facility. Simply previewing a marker never changes the origin.

### Optional controls

- **Overall / daytime (09:00-21:00)** changes the occupancy metric. Overall does not mean nighttime.
- **Filter alternatives** expands district/type filters. These never hide the selected baseline and cannot expand eligibility beyond same/bordering districts.
- **Online street layer** adds OpenStreetMap tiles only when explicitly activated. Without it, district outlines and markers work offline.
- **Fit results** restores the map viewport to the available markers.
- The collapsed **RDF / SPARQL** section contains source-resource links, raw recorded history, border evidence, executed queries, and provenance.

For a concrete example, select PLAZA MAYOR, January, Average, and Overall. Inspect how many Januaries contributed, then select 2025 to see its exact January observation instead.

## 3. What the occupancy values mean

### Average across recorded years

For facility `p`, month `m`, and metric `k`, take each recorded observation in that calendar month whose selected metric lies within 0-100:

```text
historical monthly average = sum(valid percentages) / number(valid observations)
```

For example, hypothetical January values 40%, 60%, and 80% produce a historical January average of 60%, with three contributing observations. An invalid value of -20% is excluded, not clamped to zero.

Every valid observation receives equal weight:

- No recency weighting.
- No weighting by capacity or calculation days.
- No automatic COVID-year exclusion.
- No conversion into a probability of finding a space.

The average covers **each facility's own available valid years**. Two alternatives can therefore use different year sets. Counts and actual years are shown so that this is not concealed.

The sample count is an observation count. In the reviewed dataset there is one observation per facility/year/month. A repeated percentage in several years still counts once for each observation: the implementation does not average distinct percentage values.

### Specific year

January 2025 means that exact recorded January 2025 value. Missing January 2025 data does not become January 2024 or the all-years average.

### Comparing values

If the selected facility averages 70% and another averages 55%, the displayed difference is **15 percentage points lower**.

This is a descriptive comparison of historical data. It does not show real-time vacancy, free spaces now, walking distance, traffic conditions, or a statistical forecast. If the selected facility lacks valid data, alternatives remain visible but no difference claim is calculated.

## 4. RDF and knowledge databases explained

### RDF triples

RDF represents a fact as **subject / predicate / object**:

```turtle
<http://parking.linkeddata.upm.es/resource/parking/ALMAGRO>
    <http://parking.linkeddata.upm.es/property/locatedIn>
    <http://parking.linkeddata.upm.es/resource/district/Chamber%C3%AD> .
```

The subject is a parking facility, the predicate says "located in", and the object identifies a district.

- A **resource** is an identifiable entity: facility, district, type, or observation.
- An **IRI**, often called a URI, identifies that resource. It is not merely its display name.
- An object may be another resource or a **literal** such as a string, percentage, or year.
- **Turtle** is a readable RDF file format. Prefixes abbreviate IRIs; `a` abbreviates `rdf:type`.

The same district resource can be referenced by many facilities. The same facility can link to many monthly observations. This sharing of identifiers makes a graph rather than disconnected text records.

An IRI can identify an RDF resource without having a working public webpage at that address. Inspect its local facts through the app or Fuseki.

### Ontology versus instance data

The [ontology](../ontology/ontology.ttl) defines the vocabulary: classes and properties such as `ParkingFacility`, `District`, and `locatedIn`.

The reviewed Turtle contains **instances**: ALMAGRO, its district, its observations, and their measurements.

OWL/RDFS domain and range declarations are not automatic database integrity constraints. This application does not enable an OWL reasoner, infer new facts from domains/ranges, or claim to perform SHACL validation.

### Fuseki and TDB2

**Apache Jena Fuseki** is the local server that accepts SPARQL queries over HTTP and returns RDF query results. **TDB2** stores the RDF persistently on disk. A **triple store** is a database specialized for RDF graphs.

The browser is not the graph database. It calls Node, Node sends a SPARQL query to Fuseki, and the browser renders the returned results.

### Three named graphs

A named graph associates an IRI with a set of RDF triples:

| Graph IRI | Contents |
|---|---|
| `urn:madrid-parking:reviewed` | Unchanged reviewed facilities, districts, types, observations, and identity links |
| `urn:madrid-parking:wikidata` | External district border relationships, labels, administrative context, and snapshot provenance |
| `urn:madrid-parking:geography` | Verified supplementary coordinates using the existing facility IRIs as subjects |

This separation prevents external enrichment from becoming an undocumented modification of the submitted dataset. Queries use explicit `GRAPH` clauses, not a database-dependent default-graph union.

District GeoJSON is a local **visualization asset**, not a fourth RDF graph or the source of alternative eligibility.

## 5. The parking model

The existing vocabulary has four principal classes:

| Class | Meaning | Important properties |
|---|---|---|
| `mp:ParkingFacility` | Identified parking facility | `parkingName`, `locatedIn`, `hasParkingType`, `hasObservation` |
| `mp:District` | District represented in the source | `districtName`, `owl:sameAs` |
| `mp:ParkingType` | Recorded type, such as mixed/rotational | `rdfs:label` |
| `mp:OccupancyObservation` | Facility's monthly observation | `observationOf`, `year`, `month`, `numberOfSpaces`, occupancy metrics |

`locatedIn` and `hasObservation` are **object properties**, pointing to resources. Names, years, percentages, and capacities are **datatype properties**, pointing to literal values.

Capacity belongs to an observation, not a timeless facility attribute. The year uses `xsd:gYear`, such as `"2025"^^xsd:gYear`; month is an integer. Templates preserve these datatypes.

The reviewed source contains **62 facilities, 12 represented districts, and 4,754 observations**, with recorded periods from January 2019 through September 2026. Individual facilities have different coverage.

The data also has:

- Facilities with multiple recorded types.
- Two facilities with multiple recorded districts.
- 10 overall percentages and 20 daytime percentages outside 0-100.

These are preserved and disclosed, not silently "fixed" by rewriting the reviewed file.

## 6. How Wikidata determines the alternatives

### Identity links are not just matching names

For example, the reviewed graph links:

```turtle
<http://parking.linkeddata.upm.es/resource/district/Centro>
    <http://www.w3.org/2002/07/owl#sameAs>
    <http://www.wikidata.org/entity/Q1763376> .
```

This identifies the local district and the Wikidata district as the same real-world entity. There is no need to reconcile its name again for each property.

The app follows the existing link to find **relationships of the linked entity**. It does not assert that a district is identical to its neighbor or to a property.

Keep the canonical `http://www.wikidata.org/entity/...` identifiers used in the reviewed RDF. Changing them to HTTPS creates different RDF terms and breaks an exact join.

### The border traversal

The core path is:

```text
selected facility
  -> local district
  -> owl:sameAs Wikidata district
  -> P47 shares border with another Wikidata district
  <- owl:sameAs another local district
  <- locatedIn another parking facility
  -> hasObservation monthly observations
```

`P47` is an actual Wikidata relationship, not a hardcoded neighbor list or a guessed distance rule.

The snapshot retains the recorded direction. SPARQL uses:

```sparql
?originWD (wdt:P47|^wdt:P47) ?candidateWD .
```

`|` means either path; `^` means reverse direction. This follows **one border edge**, not an unlimited chain of districts.

The snapshot additionally retains non-deprecated seed-district `P131` administrative-parent claims and labels for referenced entities. It is a bounded projection, not a complete Wikidata mirror; it does not preserve full statement qualifiers/references.

### What demonstrates knowledge-graph behavior?

Candidate eligibility depends on a join across independently sourced RDF graphs. Removing relevant border triples in a disposable graph dataset removes border alternatives while same-district alternatives remain.

This demonstrates entity linking, shared resource identifiers, graph traversal, and cross-dataset joins. Merely showing a Wikidata hyperlink would not.

Equivalent logic could be implemented in a relational database, but here the linked RDF relationships are the actual application inputs, not decorative exports.

## 7. SPARQL and aggregation

### Primary operation

`facilityComparison` validates:

- Selected facility and its recorded district context.
- Month.
- Year as either `average` or a recorded year.
- Overall/daytime metric.
- Optional alternative district/type.

It finds same/bordering candidates, retrieves their observations, computes valid means/counts/coverage, and optionally joins their coordinates.

The browser formats returned numbers; it does **not** load an embedded parking dataset or calculate a separate set of means.

### Simplified monthly average query

```sparql
PREFIX mp: <http://parking.linkeddata.upm.es/ontology/>
PREFIX prop: <http://parking.linkeddata.upm.es/property/>

SELECT ?parking
       (AVG(?occupancy) AS ?januaryMean)
       (COUNT(?observation) AS ?samples)
WHERE {
  GRAPH <urn:madrid-parking:reviewed> {
    ?parking a mp:ParkingFacility ;
             prop:hasObservation ?observation .
    ?observation prop:month 1 ;
                 prop:occupancyPercentage ?occupancy .
  }
  FILTER (?occupancy >= 0 && ?occupancy <= 100)
}
GROUP BY ?parking
```

The real query also retains facilities with no valid observations, exposes excluded counts/years/capacity ranges, handles exact-year mode and graph eligibility, and joins geography with `OPTIONAL`.

Aggregation happens before joining optional coordinates, types, or border evidence, avoiding accidental multiplication of observations. Type matching uses `EXISTS`, and reciprocal border statements are tested as existence conditions.

When a candidate belongs to multiple recorded districts, it appears only once: prefer the selected district if recorded there; otherwise use the lexicographically first eligible recorded bordering district IRI as a deterministic **display/grouping context**, not a geographic correction. For a selected multi-district facility the user chooses the origin explicitly.

### Supporting operations

| Operation | Purpose |
|---|---|
| `catalog` | RDF-derived facilities/district contexts, types, years, and periods |
| `coverage` | Source counts, invalid-value counts, Wikidata timestamp/edge count |
| `neighbors` | Actual border evidence and optional local district identities |
| `history` | Raw observations for the selected metric across recorded months |
| `search` | Retained exact-period exploration operation |
| `compare` / `comparisonCoverage` | Retained exact-period district comparison operations |

All queries are allowlisted templates in [queries.mjs](queries.mjs). No arbitrary query editor, SPARQL Update, or remote `SERVICE` execution is exposed by the app.

The API responds with the exact query and standard SPARQL JSON bindings, retaining RDF term types/datatype information. The collapsed query inspector displays both and retains the most recent 12 operations.

## 8. Geographic reconciliation and the map

### Official sources

The municipal Geoportal provides:

- [Parking point layer](https://sigma.madrid.es/hosted/rest/services/GEOPORTAL/APARCAMIENTOS_PUBLICOS/MapServer/0).
- [District polygon layer](https://sigma.madrid.es/hosted/rest/services/CARTOGRAFIA/LIMITES_ADMINISTRATIVOS/MapServer/3).

The importer requests `outSR=4326`, yielding longitude/latitude coordinates. The service's native EPSG:25830 values are projected meters and must not be interpreted directly as latitude/longitude.

The older municipal parking JSON catalog currently contains malformed JSON with a double-minus longitude. The importer does not silently repair it; it uses the parseable Geoportal feed.

### Conservative matching

[geography.mjs](geography.mjs) queries the reviewed facilities and districts from Fuseki. A coordinate is accepted only when:

1. A normalized exact name has a unique municipal match.
2. Its geometry is a valid, plausible point.
3. The point lies within at least one of the facility's reviewed district polygons.

Normalization removes accents, case differences, and punctuation. It does not remove arbitrary words or fuzzy-match similar names.

The current audit accepts **57 of 62 facilities**. Five remain intentionally unmapped:

- ARQUITECTO RIBERA (BARCELO).
- ARTILLEROS.
- AVENIDA AMERICA (intercambiador).
- ORIENTE.
- SANTA ANA.

Names above are shown without some accents for readability; the interface/report retains source spelling. An alias that looks obvious is not proof of identity. These facilities keep their original URIs and occupancy results in the interface.

[data/geography-report.json](data/geography-report.json) records every matched/unmatched facility, claimed districts, source feature, coordinates/address where accepted, matching method, CRS, and retrieval time.

[data/geography.ttl](data/geography.ttl) adds `geo:lat` and `geo:long` triples to **existing facility IRIs**, with source metadata. It does not rewrite the submitted RDF or assert unverified `owl:sameAs` statements.

### Colors and interactions

| Marker | Meaning |
|---|---|
| Green | Valid occupancy below 50% |
| Amber | 50% to below 80% |
| Red | 80% through 100% |
| Gray | No valid metric for the selection |
| Strong outer ring | Your selected facility |

These are visual bins, not calibrated vacancy probabilities. Labels, percentages, and the selected ring supplement color.

The map supports pan/zoom, fit-to-results, accessible marker labels, and popups. If reviewed identities share identical coordinates, popups disclose the other identities; the selector/lists keep each accessible rather than inventing different positions.

Outlines highlight the origin and represented bordering districts. Map polygons do not determine borders for alternative eligibility: Wikidata `P47` does.

### Offline and optional street tiles

Leaflet, outlines, and coordinates are local assets. The default map makes no street-tile requests.

If enabled, the street layer requests `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with visible attribution and normal browser caching. There is no bulk download, tile prefetch, or claim that OSM's public tile service is an offline package.

Street-layer errors leave the local map/results usable. Missing local outlines produce an explicit warning; missing coordinates do not remove facilities from lists. Current locations/outlines are context, not reconstructed historical geography.

## 9. Architecture and file guide

```text
Browser: controls, cards, list, local map
    -> GET /api/query with validated operation parameters
Node server
    -> POST SPARQL query to loopback Fuseki
Fuseki / TDB2
    -> reviewed graph + Wikidata graph + geography graph
    -> SPARQL JSON results
Browser renders the same returned values in map and cards
```

| File | Role |
|---|---|
| [index.html](index.html) | Facility-first interface and collapsed technical panels |
| [styles.css](styles.css) | White-and-blue default theme, optional dark mode, unchanged occupancy colors, and responsive presentation |
| [app.js](app.js) | UI state, validated API calls, baseline/alternative/history rendering |
| [map.js](map.js) | Geographic outlines, markers, preview, fit, opt-in street tiles |
| [server.mjs](server.mjs) | Loopback HTTP/API server and explicit public-file allowlist |
| [queries.mjs](queries.mjs) | SPARQL templates and graph IRIs |
| [store.mjs](store.mjs) | Fuseki execution and RDF-derived parameter catalog |
| [data.mjs](data.mjs) | Reviewed/snapshot graph imports, Wikidata refresh, integrity metadata |
| [geography.mjs](geography.mjs) | Municipal location reconciliation and snapshot generation |
| [fuseki-config.ttl](fuseki-config.ttl) | Persistent TDB2 dataset and normal query-only endpoint |
| [setup.ps1](setup.ps1) | Verified Fuseki download and maintenance/import lifecycle |
| [start.ps1](start.ps1) | Single foreground supervisor for both background services; shared shutdown and failure cleanup |
| [start-fuseki.ps1](start-fuseki.ps1), [start-app.ps1](start-app.ps1) | Start local services |
| [data/wikidata.ttl](data/wikidata.ttl) | Cached external border/context graph |
| [data/geography.ttl](data/geography.ttl) | Verified coordinate enrichment graph |
| [data/districts.geojson](data/districts.geojson) | Local polygon visualization with provenance |
| [data/geography-report.json](data/geography-report.json) | Reconciliation audit |
| [vendor/](vendor/) | Pinned Leaflet assets and license |
| `runtime/` | Ignored downloaded runtime, persistent database, import metadata, and logs |

The Node server only serves explicitly listed public assets. Its API accepts read-only GET operations, not arbitrary SPARQL. It validates identifiers against its RDF-derived catalog and restricts metrics/months/year mode.

No Group13 submission files are changed. All enrichment and UI changes belong to this application directory.

## 10. Refresh and reproducibility

### Refresh Wikidata

With normal Fuseki running:

```powershell
node data.mjs refresh
```

The utility derives seed identities from the reviewed graph and retrieves a bounded public entity snapshot. A failed request/validation does not replace the previous snapshot or timestamp.

### Refresh geography

With normal Fuseki running:

```powershell
node geography.mjs
```

The utility validates source responses, reconciles facilities, and writes the coordinate Turtle, district GeoJSON, and audit report. Inspect unmatched/ambiguous results instead of inserting guessed aliases. A fetch/validation failure is explicit; it does not silently claim the previous data is newly retrieved.

### Load refreshed snapshots

Refreshing files does not mutate an already loaded RDF graph:

1. Stop Node and normal Fuseki.
2. Run `.\setup.ps1`.
3. Restart Fuseki, wait for readiness, then restart Node.

The Node parameter catalog is cached for its process lifetime, so restart after imports. Ordinary operation, including setup using already downloaded Fuseki and included snapshots, works offline.

### Verify the reviewed file

Its reviewed SHA-256 is:

```text
366fac4987fdc0b00e160663117d36d85a4a72b2ec44ea921f2386e2c1b2300b
```

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '..\rdf\aparcamientos-with-links.ttl'
Get-Content -LiteralPath '.\runtime\source.json'
```

Setup reads source bytes directly, replaces the reviewed named graph rather than appending another parking dataset, and checks its source fingerprint again after import. Its import metadata stores the source path relative to the application directory (`../rdf/aparcamientos-with-links.ttl`), not an absolute machine path.

Snapshot timestamps describe retrieval, not occupancy measurement dates or guarantees of current external claims.

## 11. Data limitations and missing values

- Monthly historical averages cannot establish a free space now, a probability, or an occupancy at a particular hour.
- Overall and daytime are the only supported source metrics. Overall minus daytime is not a valid inferred nighttime value.
- Out-of-range values are preserved in raw history and excluded from means/rankings. Values within 0-100 pass only a plausibility check, not full statistical validation.
- A facility with no valid sample is labeled explicitly. Valid data from other years never fills a missing exact-year observation.
- Each facility's mean can cover different years. Coverage is exposed, not silently equalized.
- Types are facility-level relationships without period assignments. A facility may match multiple types.
- Multiple district assignments are retained; selection context/grouping does not repair them.
- Only 12 districts have parking coverage. A border neighbor outside this set has no parking coverage **in this dataset**, not necessarily no parking in reality.
- Missing border relationships are unknown in the snapshot, not proof that no border exists.
- Borders and map geometry describe current snapshots alongside historical observations, not reconstructed historic administrative boundaries.
- Verified coordinates are optional enrichment. No district centroid or guessed pin is substituted for an unmatched facility.

## 12. Troubleshooting

| Symptom | Action / explanation |
|---|---|
| `node` / `java` not found | Install supported versions and reopen PowerShell |
| Java class-version error | Check Java 21+ is the runtime actually on PATH |
| Setup refuses ports 3030/3031 | Stop the owning parking service; do not kill unrelated applications |
| Download checksum failure | Do not accept the archive; investigate connectivity/mirror integrity |
| TDB2 lock error | Another process has the database open; stop that service rather than deleting locks |
| `fetch failed` / query errors | Confirm both services run and wait for Fuseki readiness |
| Missing graph / old UI data | Stop services, rerun setup, restart both, reload browser |
| Average shows no valid data | Check actual observation coverage and flagged counts |
| Only two observations in a late period | Dataset-wide latest period is not every facility's latest period |
| District context requested | The reviewed facility has multiple district assignments; choose one |
| Facility has no map pin | It did not pass the conservative geography reconciliation; lists still work |
| Map outlines unavailable | Restore the included GeoJSON/check browser network errors; list queries remain independent |
| Online streets unavailable | Disable the street layer; local outlines/markers remain available |
| No alternatives under a district filter | The filter cannot add districts outside the selected origin's same/border graph scope |
| Resource URL is not a webpage | IRIs identify facts locally even when not publicly dereferenceable |
| Refresh failed | Resolve the explicit error; do not treat an old snapshot as newly fetched |

Query failures appear explicitly, not as mock data or an apparently successful empty dataset.

## 13. Assignment coverage and demonstration

| Requirement | Implementation |
|---|---|
| R1: parking information | Selected card, alternatives, history |
| R2: district filter | Secondary alternatives filter and explicit comparison origin |
| R3: type filter | Existing facility-level type relationship |
| R4: year/month selection | Month plus Average/specific-year dropdown |
| R5: occupancy percentage | Historical mean or exact observation for selected metric |
| R6: number of spaces | Observation-specific capacity or explicitly labeled contributing range |
| R7: RDF support | Direct reviewed Turtle import |
| R8: SPARQL | Data selection, aggregation, graph traversal, and coverage queries |
| R9: identified RDF resources | Existing facility/district/type/observation model retained |
| R10: readable tabular results | Raw history table; readable cards plus full SPARQL JSON |

### Suggested demonstration

1. Select PLAZA MAYOR and January Average.
2. Explain valid observations, contributing years, and arithmetic mean.
3. Switch to a specific year to demonstrate exact-period behavior.
4. Compare a same-district facility and a bordering-district facility on the map.
5. Open technical evidence: identify `owl:sameAs`, a real `P47` triple, and the associated SPARQL pattern.
6. Show the separate reviewed/Wikidata/geography graphs and unchanged source hash.
7. Show an unmatched facility such as ARTILLEROS: occupancy remains usable without an invented pin.
8. Explain different year coverage and invalid raw observations.
9. Disable external networking with the street layer off and repeat.

To establish causal graph dependence, use a separate disposable store and remove border triples there. Border alternatives should disappear; same-district alternatives and source observations must remain. Never edit the reviewed file or experiment destructively on the persistent application database.

No frontend build is needed. Validation should cover actual SPARQL execution, arithmetic against raw observations, map/list equality, missing/invalid cases, multiple districts/types, keyboard/mobile behavior, and offline operation. Run builds or automated test suites only when explicitly requested.

### Verified examples for this implementation

- PLAZA MAYOR / January / Overall / Average returns **47.4125% from eight observations** (2019-2026), displayed as 47.4%. An independent arithmetic calculation from the raw history agrees.
- Selecting January 2025 instead returns **49.9% from one observation**.
- December 2026 has no valid observation; it is not shown as zero or replaced with another period.
- An invalid MONTALBAN observation for October 2021 remains flagged in history and produces no numeric selected mean in exact-year mode.
- All 64 reviewed facility/district contexts were queried with no duplicate facility candidates and exactly one selected baseline per context.
- In an isolated in-memory graph store, deleting snapshot border triples reduced the PLAZA MAYOR January comparison from 45 related facilities to 24 selected/same-district facilities. Its baseline mean and same-district alternatives stayed unchanged; the normal application snapshot retained all 75 directed border triples.
- Real-browser checks covered average/exact-year switching, explicit origin changes, multi-district prompts, the unmapped ARTILLEROS baseline, popup values, both themes, a 390-pixel viewport without document overflow, and query-failure recovery.
- The default browser walkthrough made no external HTTP requests. Blocking online street tiles left all local markers/outlines usable.

These are focused runtime/browser verification results, not a new build pipeline or an automated test suite.

## 14. Sources, licenses, and future extensions

### Parking source

Credit **Ayuntamiento de Madrid / Madrid Open Data, historical occupancy of municipal public parking**, and Group13's RDF transformation/linking.

- [Original occupancy dataset](https://datos.madrid.es/dataset/300346-0-aparcamientos-ocupa-historico).
- [Group13 analysis and licensing](../analysis.html).
- [Original application requirements](../requirements/applicationrequirements.html).

Group13 records [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) for the parking data. Retain the source attribution and license links. The reviewed parking facts are unchanged; supplemental snapshots and query-time summaries are separate additions.

### Geography, borders, and software

- [Municipal parking geography metadata](https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=d1fe870f-04d1-11f0-a71f-c8e265b91dd3).
- [Municipal district geography service](https://sigma.madrid.es/hosted/rest/services/CARTOGRAFIA/LIMITES_ADMINISTRATIVOS/MapServer).
- [Ayuntamiento de Madrid reuse terms](https://datos.madrid.es/pages/condiciones-generales-ayuntamiento-de-madrid).
- [Wikidata P47 semantics](https://www.wikidata.org/wiki/Property:P47) and [CC0 structured-data licensing](https://www.wikidata.org/wiki/Wikidata:Licensing).
- [Leaflet](https://leafletjs.com/), BSD-2-Clause; see [vendor/LICENSE-Leaflet](vendor/LICENSE-Leaflet).
- [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) and [public tile usage policy](https://operations.osmfoundation.org/policies/tiles/), for the optional online layer.
- [Apache Jena Fuseki](https://jena.apache.org/documentation/fuseki2/).
- [SPARQL 1.1](https://www.w3.org/TR/sparql11-query/).

Future extensions could include carefully verified aliases, walking-distance comparisons using a real routing service, or landmark discovery through Wikidata administrative/class hierarchies. They are intentionally outside this simple month/facility comparison workflow.
