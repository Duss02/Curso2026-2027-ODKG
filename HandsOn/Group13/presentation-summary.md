# Group13 presentation summary: from CSV to a linked-data application

This is the team's explanation guide: what we built, how the repository's artifacts fit together, and which knowledge-graph concepts each stage demonstrates. For detailed operation and troubleshooting, use the [application README](local-app/README.md).

## 1. The story in one paragraph

> We started with Madrid's historical parking-occupancy CSV files. We cleaned their values, designed an ontology for facilities, districts, types, and monthly observations, and wrote RML mappings to generate RDF. We reconciled district names against Wikidata in OpenRefine, exported the matched identifiers, and generated a linked RDF dataset using `owl:sameAs`. Our application preserves that reviewed dataset, adds separate RDF snapshots of Wikidata border relationships and verified municipal coordinates, and queries the three graphs together with SPARQL. Users choose a parking facility and a month, inspect its historical occupancy, and compare facilities in the same or bordering districts on a map.

**The important qualification:** this is historical exploration, not real-time availability, a prediction, or a guarantee of finding a space.

## 2. The complete pipeline

```text
Madrid historical CSV files
        |
        v
Analysis + cleaning / normalization in OpenRefine
        |
        v
Cleaned CSV ---------------------- Ontology + URI naming strategy
        |                                      |
        +------------------+-------------------+
                           |
                           v
                    Initial RML mappings
                           |
                           v
                    Initial RDF / Turtle

Cleaned CSV -> OpenRefine district reconciliation against Wikidata
                           |
                           v
              CSV with Wikidata identifier column
                           |
                           v
                  Updated RML mappings
                           |
                           v
              Reviewed linked RDF / Turtle
                           |
             +-------------+----------------+
             |                              |
             v                              v
     Wikidata API snapshot       Madrid Geoportal GeoJSON
     -> border/context RDF       -> matched coordinate RDF
                                 -> district-outline GeoJSON
             |                              |
             +---------------+--------------+
                             |
                             v
        Fuseki / TDB2: three separate local named graphs
                             |
                             v
             SPARQL -> Node API -> browser + map
```

The ontology and mappings play different roles: **the ontology defines the meaning of the terms; the mappings define how source values become facts expressed with those terms.**

## 3. Concepts we should be able to explain

| Concept | Meaning | Where we use it |
|---|---|---|
| **CSV** | A tabular serialization: rows and columns, without explicit RDF relationships. | Original measurements and cleaned mapping inputs. |
| **Vocabulary** | A collection of named terms with agreed meanings. | Our parking classes/properties, plus reused RDF, RDFS, OWL, XSD, and geography terms. |
| **Ontology** | A formal domain model defining classes, properties, and semantic relationships or declarations. | [ontology.ttl](ontology/ontology.ttl) defines our lightweight parking model. |
| **Class / instance** | A category versus a particular member of that category. | `ParkingFacility` versus the ALMAGRO resource. |
| **URI / IRI** | An identifier for a resource; an IRI generalizes URI character support. | Shared identifiers connect facilities, observations, districts, and external entities. |
| **Literal / datatype** | A value, optionally typed or language-tagged. | `"2025"^^xsd:gYear`, integer months, decimal percentages. |
| **Object / datatype property** | A relationship to another resource versus a relationship to a literal value. | `locatedIn` points to a district; `occupancyPercentage` points to a number. |
| **RDF** | A graph data model made of subject-predicate-object triples. | Both the generated parking facts and the enrichment snapshots. |
| **Turtle / TTL** | A readable syntax for serializing RDF, commonly saved as `.ttl`. | Ontology, generated data, and enrichment files. RDF is the model; Turtle is a file format. |
| **RML** | RDF Mapping Language: declarative rules for generating RDF from sources such as CSV. It extends the R2RML mapping approach beyond relational inputs. | The original and linked mapping files. |
| **Mapping / materialization** | The conversion recipe versus executing that recipe to produce RDF facts. | An RML processor reads the CSV and mappings and writes the generated dataset. |
| **Reconciliation** | Identifying which external entity a local value refers to, rather than merely matching text. | OpenRefine matches a Madrid district name to a Wikidata Q-identifier. |
| **Linking** | Recording the identified relationship explicitly in the data. | `owl:sameAs` connects a local district to its Wikidata entity. |
| **SPARQL** | A language for querying RDF graph patterns, paths, filters, and aggregates. | Selects facilities, follows district borders, and calculates historical means. |
| **Triple store / named graph** | An RDF database / a separately named collection of triples within an RDF dataset. | TDB2 persists three graphs; graph names preserve source separation. |
| **Fuseki** | Apache Jena's server exposing SPARQL over HTTP. | The local query endpoint, not the user interface or the ontology. |
| **Provenance / snapshot** | Information about a fact's source and retrieval / a locally saved projection at a particular retrieval time. | External source links, retrieval timestamps, matching audit, and source fingerprint. |
| **GeoJSON** | A JSON format for geographic features and geometries, not an RDF serialization. | Municipal API responses and the local district-outline map asset. |

## 4. Step 1: choose and understand the source data

**Evidence:** [source analysis](analysis.html), [dataset requirements](requirements/datasetRequirements.html), and the [CSV directory](CSV/).

The source is Madrid's [Historical Occupancy of Public Municipal Parking dataset](https://datos.madrid.es/dataset/300346-0-aparcamientos-ocupa-historico). The eight original CSV files cover 2019 through September 2026. A meaningful source row describes a facility's measurements for one year and month.

Important fields include facility name/code, district name/code, parking type, year, month, number of spaces, calculation days, average vehicles per day, overall occupancy, and daytime occupancy.

The source analysis identified practical issues:

- Semicolon-separated records, quoted headings containing line breaks, decimal commas, and percentages containing `%`.
- Inconsistent whitespace, accents, and type labels such as `ROT` / `ROTACIONAL` and `MIX` / `MIXTO`.
- Blank records and an unused extra descriptive column in some years.
- Historical changes in capacity and implausible numeric values.

**Why this matters:** a graph does not automatically repair messy source data. We first need to understand units, identifiers, temporal meaning, and quality.

**What to say:** "We modeled monthly observations, not live parking sensors. Before creating RDF, we checked what each row and each measurement actually means."

## 5. Step 2: clean and normalize the CSV

**Evidence:** [OpenRefine cleaning operations](openrefine/operations.json) and the resulting [cleaned CSV](CSV/csv2-updated.csv). The [deprecated combined CSV](CSV/deprecieted-combined.csv) is an intermediate artifact, not the current mapping input.

The cleaned input has **4,754 rows** and consistent column names:

```text
ANIO, MES, NOMBRE_APARCAMIENTO, CODIGO_PAR, TIPO, NUM_PLAZAS,
CODIGO_DISTRITO, DISTRITO, DIAS_CALCULO, VEHICULOS_DIA_MEDIA,
OCUPACION, OCUPACION_9_21
```

The preparation normalizes:

| Source representation | Prepared representation | Purpose |
|---|---|---|
| Whitespace/accent variants of district names | Consistent district labels | Reduce accidental differences during identification. |
| `ROT`, `ROTACIONAL` | `rotational` | Give one category a consistent identifier. |
| `MIX`, `MIXTO` | `mixed` | Same principle for mixed parking. |
| `16,7%` | Numeric `16.7` | Support typed decimal values and arithmetic. |
| Month `1` | CSV value `01` for URI templates | Build consistent observation identifiers. The RDF month remains an integer. |
| Multiline human-oriented headings | Stable names such as `NOMBRE_APARCAMIENTO` | Make mapping references predictable. |

The operation history contains intermediate percentage conversions and later restoration to percentage units. **The final data uses 0-100-style percentages, not 0-1 fractions:** `16.7` means 16.7%, not 1,670%.

The cleaning history is saved as groups of operations, not a single complete end-to-end automation script. Describe the final exported values and documented operations; do not claim that every preparation action is captured by one replay command.

Outliers were not silently replaced with plausible numbers. The final linked data retains **10 invalid overall percentages and 20 invalid daytime percentages** outside 0-100. The application excludes them from valid comparisons while exposing missing/excluded data.

**Concepts demonstrated:** data quality, normalization, consistent units, and preparation for typed literals.

## 6. Step 3: design the ontology and resource identifiers

**Evidence:** [ontology](ontology/ontology.ttl), [example instantiation](ontology/parking-example.ttl), and the naming strategy in the [analysis](analysis.html). The ontology metadata identifies Chowlk as its creation tool.

### The four classes

```text
ParkingFacility --locatedIn------> District
       |
       +---------hasParkingType--> ParkingType
       |
       +---------hasObservation--> OccupancyObservation
                                           |
                                           +--observationOf--> ParkingFacility
                                           +--year / month
                                           +--numberOfSpaces
                                           +--occupancyPercentage
                                           +--daytimeOccupancyPercentage
```

The observation also carries calculation days and average vehicles per day.

**The key modeling decision:** capacity and occupancy belong to a monthly observation, not to an unchanging facility record. Otherwise, different historical measurements would be collapsed into timeless values.

An ontology declaration looks like this:

```turtle
@prefix mp: <http://parking.linkeddata.upm.es/ontology/> .
@prefix prop: <http://parking.linkeddata.upm.es/property/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

prop:locatedIn a owl:ObjectProperty ;
    rdfs:domain mp:ParkingFacility ;
    rdfs:range mp:District .
```

This describes a term's intended semantics. A particular facility-to-district triple is **instance data**, not another ontology definition.

### Naming strategy

- Classes: `http://parking.linkeddata.upm.es/ontology/ParkingFacility`
- Properties: `http://parking.linkeddata.upm.es/property/locatedIn`
- Facilities: `http://parking.linkeddata.upm.es/resource/parking/ALMAGRO`
- Observations: `http://parking.linkeddata.upm.es/resource/observation/ALMAGRO/2019/01`
- Districts and types have their own resource paths.

An identifier is not just a label, and it need not resolve to a public webpage for the local graph to use it.

**Important naming limitation:** although the CSV retains source codes, the submitted mappings build facility and district URIs from names. There are **57 source parking codes but 62 exact distinct facility-name strings and 62 facility resources**. Do not describe that difference as discovering five additional physical car parks. Name-based identity can split historical names/case variants; the application preserves the reviewed resources rather than attempting an unverified merge.

District labels also change from uppercase in the cleaned input to title case in the linked input, changing their name-based URIs. The application consistently uses the final linked dataset. URI case, percent-encoding, and `http` versus `https` matter when matching RDF terms.

**What to say:** "The ontology is our semantic blueprint. The URI strategy gives individual entities stable references within the generated dataset, although using names rather than source codes has identity limitations."

## 7. Step 4: write mappings and generate the initial RDF

**Input:** [cleaned CSV](CSV/csv2-updated.csv).  
**Recipe:** [initial RML mappings](mappings/mapping.rml.ttl).  
**Output:** [initial RDF](rdf/aparcamientos.ttl).

The mapping contains four triples maps, corresponding to the four classes. A source row can therefore contribute facts about several resources, not just become one anonymous graph node.

This shortened excerpt is part of the original facility mapping:

```turtle
@prefix rr: <http://www.w3.org/ns/r2rml#> .
@prefix rml: <http://semweb.mmlab.be/ns/rml#> .
@prefix ql: <http://semweb.mmlab.be/ns/ql#> .
@prefix mp: <http://parking.linkeddata.upm.es/ontology/> .
@prefix prop: <http://parking.linkeddata.upm.es/property/> .
@base <http://parking.linkeddata.upm.es/mapping/> .

<#ParkingFacilityMap> a rr:TriplesMap ;
    rml:logicalSource [
        rml:source "CSV/csv2-updated.csv" ;
        rml:referenceFormulation ql:CSV
    ] ;
    rr:subjectMap [
        rr:template "http://parking.linkeddata.upm.es/resource/parking/{NOMBRE_APARCAMIENTO}" ;
        rr:class mp:ParkingFacility
    ] ;
    rr:predicateObjectMap [
        rr:predicate prop:hasObservation ;
        rr:objectMap [
            rr:template "http://parking.linkeddata.upm.es/resource/observation/{NOMBRE_APARCAMIENTO}/{ANIO}/{MES}" ;
            rr:termType rr:IRI
        ]
    ] .
```

Read this as: "For each CSV row, construct the facility URI, type it as a parking facility, construct the monthly observation URI, and connect them."

Other predicate-object maps read a column with `rml:reference`, assign a predicate, and declare a datatype such as `xsd:decimal`. Districts, types, and observations become resources through their own maps. Identical constructed IRIs connect the generated facts.

**RML versus Turtle:** the mapping itself is RDF syntax describing conversion rules. Executing it produces a different RDF document containing parking facts. A `.rml` filename does not make the file the populated parking database.

The repository includes both recipes and generated outputs, but does not pin an RML processor version or preserve a complete generation command. For regeneration, use a compatible RML processor and resolve the `CSV/...` logical-source paths from Group13. Generate a scratch output for comparison rather than overwriting the reviewed submission.

**Concepts demonstrated:** declarative mapping, templates, references, typed values, resource reuse, and RDF materialization.

## 8. Step 5: reconcile districts in OpenRefine and generate linked RDF

**Evidence:** [reconciliation history](lodrefine/aparcamientos-with-links.json), [linked CSV](CSV/aparcamientos-with-links.csv), [linked mappings](mappings/aparcamientos-with-links.rml), and [linked RDF](rdf/aparcamientos-with-links.ttl).

### Reconciliation: identify the entity

The saved history reconciles the `DISTRITO` column through the Wikidata reconciliation service at `https://wikidata.reconci.link/en/api`, constrained to administrative territorial entities (`Q56061`). It records accepted matches for district names, for example:

```text
CENTRO   -> Centro, Madrid   -> Q1763376
CHAMBERÍ -> Chamberí, Madrid -> Q1763370
```

This is not just replacing text with a similarly spelled name. The purpose is to identify the **same real-world Madrid district**, avoiding similarly named places elsewhere. The history includes automatic matching configuration and recorded match judgments; the final export contains 12 district identities.

### Export the identity into the table

An added column, `same_as_wikidata_distrito`, stores identifiers such as:

```text
http://www.wikidata.org/entity/Q1763376
```

The linked CSV still has **4,754 observations**, with **12 district names, 12 distinct Wikidata IDs, and no missing district links**.

### Linking: express the result as RDF

The updated district mapping reads that column, declares its objects to be IRIs with `rr:termType rr:IRI`, and uses `owl:sameAs` as its predicate. Materializing the linked mapping produces facts such as:

```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .

<http://parking.linkeddata.upm.es/resource/district/Centro>
    owl:sameAs <http://www.wikidata.org/entity/Q1763376> .
```

`owl:sameAs` asserts identity, not "is nearby", "has a similar name", or "belongs to". It is a strong claim and requires appropriate entity matching.

**Crucial distinction:** OpenRefine reconciled the CSV. The updated RML mapping turns the exported identifiers into RDF links. This was not the application silently editing the original RDF or OpenRefine supplying all neighboring-district relationships.

The final reviewed graph contains **62 facility resources, 12 district resources, and 4,754 observation resources**. A small example of its measurement model is:

```turtle
@prefix mp: <http://parking.linkeddata.upm.es/ontology/> .
@prefix prop: <http://parking.linkeddata.upm.es/property/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://parking.linkeddata.upm.es/resource/parking/ALMAGRO>
    a mp:ParkingFacility ;
    prop:hasObservation
        <http://parking.linkeddata.upm.es/resource/observation/ALMAGRO/2019/01> .

<http://parking.linkeddata.upm.es/resource/observation/ALMAGRO/2019/01>
    a mp:OccupancyObservation ;
    prop:year "2019"^^xsd:gYear ;
    prop:month 1 ;
    prop:numberOfSpaces 437 ;
    prop:occupancyPercentage 16.7 .
```

Here `a` abbreviates `rdf:type`; `16.7` is a Turtle decimal literal. Prefixes abbreviate full IRIs, and the semicolons attach several predicates to the same subject.

The [initial query examples](rdf/queries.sparql) check resource counts. The [linked query examples](rdf/queries-with-links.sparql) check link coverage, missing or multiple identities, malformed link objects, and facility-to-district-to-Wikidata traversal. These are collections of separate queries, not one query to paste in its entirety.

**What to say:** "Reconciliation decided which Wikidata entity each district represents. Linking recorded that decision as an RDF identity relationship."

## 9. Step 6: enrich the application without rewriting the reviewed RDF

The application's authoritative parking input is the [reviewed linked Turtle](rdf/aparcamientos-with-links.ttl). Setup reads it directly and checks a SHA-256 fingerprint; application enrichment does **not** rewrite it.

We added two independent local RDF snapshots:

| Local RDF input | Origin and preparation | Contribution |
|---|---|---|
| [Reviewed parking RDF](rdf/aparcamientos-with-links.ttl) | Our CSV-to-RDF and OpenRefine-linking pipeline. | Facilities, districts, types, observations, and identity links. |
| [Wikidata snapshot](local-app/data/wikidata.ttl) | [data.mjs](local-app/data.mjs) uses existing district Q-IDs to call Wikidata's `wbgetentities` API, then serializes selected claims as Turtle. | `P47` border relations, `P131` administrative context, labels, and provenance. |
| [Coordinate snapshot](local-app/data/geography.ttl) | [geography.mjs](local-app/geography.mjs) fetches official Madrid Geoportal GeoJSON, matches facilities, and generates RDF automatically. | `geo:lat` / `geo:long` attached to the existing facility IRIs. |

### Why no second district reconciliation is needed

After obtaining Centro's Q-ID, we can request relationships belonging to that entity. Its `P47` statements identify districts sharing its border. We are **following an existing identity**, not matching Centro's name again for each property.

For example, the Wikidata snapshot contains:

```turtle
@prefix wd: <http://www.wikidata.org/entity/> .
@prefix wdt: <http://www.wikidata.org/prop/direct/> .

wd:Q1763376 wdt:P47 wd:Q1763370 .
```

This connects Centro to Chamberí. The included snapshot has **75 directed border triples**, not necessarily 75 distinct undirected district pairs.

The original reconciliation service and the application's Wikidata API call have different roles: **identify entities first; retrieve their related facts later**.

### Geographic enrichment does require separate facility matching

The Geoportal endpoint returns **GeoJSON, not RDF**. Our script accepts a parking point only if:

1. Its normalized name uniquely matches a reviewed facility name.
2. Its point geometry and coordinates are valid and plausible.
3. The point falls inside at least one district assigned to that facility in the reviewed data.

It requests WGS84 coordinates (`EPSG:4326`) rather than treating the source's projected meters as longitude/latitude. Accepted points are converted into RDF programmatically; coordinates are not manually invented or hardcoded in the interface.

The current [matching audit](local-app/data/geography-report.json) accepts **57 of 62 facility resources**. This 57 is a geographic-match count, not the earlier count of 57 source parking codes. Unmatched facilities remain in the application without guessed markers.

The [district outlines](local-app/data/districts.geojson) remain **GeoJSON** for map drawing and geographic matching validation. They are not a fourth RDF graph and do not determine which districts qualify as neighbors in the application's comparisons; Wikidata `P47` does.

External snapshots are fetched deliberately when refreshed, not on every user interaction. Normal browsing uses local data. Optional online street tiles only add a background layer.

**Concepts demonstrated:** linked-data reuse, enrichment, cross-source identity, provenance, conservative matching, and separation of source facts from supplementary facts.

## 10. Step 7: load the knowledge base and query across graphs

**Fuseki** accepts SPARQL requests; **TDB2** persists the triples on disk. The browser is neither the RDF store nor an RML engine.

| Named graph | Contents |
|---|---|
| `urn:madrid-parking:reviewed` | The unchanged final linked parking dataset. |
| `urn:madrid-parking:wikidata` | The bounded external relationship snapshot. |
| `urn:madrid-parking:geography` | The verified coordinate enrichment. |

All three are in **one local RDF dataset**. A single query uses `GRAPH <...>` blocks and shared variables to join them; it does not need three live remote queries.

For the bordering-district comparison, the traversal is:

```text
selected facility -> local district -> owl:sameAs Wikidata district
                                              |
                                              v P47, either direction
candidate facility <- local district <- owl:sameAs neighbor Wikidata district
        |
        +-> monthly observations and occupancy
        +-> optional coordinates, using the same facility URI
```

The central relationship pattern is:

```sparql
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

# Pattern excerpt: the district variables are bound by the reviewed-graph joins.
FILTER EXISTS {
  GRAPH <urn:madrid-parking:wikidata> {
    ?originWD (wdt:P47|^wdt:P47) ?districtWD .
  }
}
```

`|` means either path, and `^` reverses a relationship's direction. This follows **one border relationship**, not every district reachable through repeated hops. The existence check avoids multiplying observations when reciprocal border statements exist.

The [complete executable example](local-app/README.md#example-occupancy-of-facilities-in-bordering-districts) starts from PLAZA MAYOR in Centro, selects January 2025 observations in bordering districts, and optionally attaches coordinates. The [actual query templates](local-app/queries.mjs) also handle historical averaging, missing values, filters, and deduplication.

Important query choices:

- `OPTIONAL` coordinates prevent an unmapped facility from disappearing.
- Validity filters exclude out-of-range occupancy from comparison arithmetic.
- `AVG` calculates a selected calendar month's mean across each facility's available valid years; counts and years expose differences in coverage.
- Aggregation happens before optional enrichment joins to avoid counting the same observation multiple times.
- The full application chooses one display context for multi-district candidates, rather than duplicating them in the results.

The ontology is the documented semantic model, but the application does **not** enable an OWL reasoner or perform SHACL validation. `owl:sameAs` is followed explicitly in query patterns; matching does not depend on automatic identity inference. Domain/range declarations are not automatic database integrity checks.

**Why this is more than displaying CSV:** external identity links lead to real border relationships that change which facilities are eligible. Shared IRIs connect independently sourced facts, and named graphs keep their origins distinguishable. SQL could implement an equivalent workflow; the contribution here is a functioning RDF/linked-data integration, not a claim that only graph databases can answer it.

## 11. Step 8: turn the queries into a useful application

**Evidence:** [application requirements](requirements/applicationrequirements.html), [application README](local-app/README.md), [Node server](local-app/server.mjs), and [query templates](local-app/queries.mjs).

The application follows this request path:

```text
Browser controls
    -> read-only Node API with validated parameters
    -> SPARQL over HTTP to local Fuseki
    -> joins and aggregates over the named graphs
    -> SPARQL JSON results
    -> cards, alternative lists, history, and map
```

The user:

1. Selects a facility, month, exact year or all-recorded-years average, and overall/daytime metric.
2. Reads the selected facility's occupancy, contributing years, sample count, excluded data, and observation-specific capacity information.
3. Compares other facilities in the **same district** and **bordering districts**, ordered by valid occupancy.
4. Uses verified map markers and district outlines to understand location. Green is below 50%, amber is 50% to below 80%, red is 80-100%, and gray indicates no valid occupancy.
5. Inspects the RDF/SPARQL evidence or explicitly chooses another comparison origin.

The browser renders the same returned occupancy values used by the lists; it is not querying an embedded copy of the historical CSV.

For average mode:

```text
historical monthly mean = sum(valid monthly percentages) / valid observation count
```

Each observation has equal weight; this is not capacity-weighted or recency-weighted. Different facilities may contribute different years. A comparison from 70% to 55% is **15 percentage points lower**, not a 15% probability improvement.

Capacity is shown for the selected observation or as a range across contributing observations. Missing exact-year data does not silently fall back to another year. Overall occupancy is not nighttime occupancy, and the daytime metric is a recorded 09:00-21:00 aggregate, not a selectable-hour measurement.

## 12. Running it and demonstrating it

Requirements are Node.js 22+, Java 21+, and either PowerShell 7 on Windows or the Bash/Linux utilities listed in the [run instructions](local-app/README.md#1-run-locally). Internet is needed for an initial Fuseki download or a deliberate external-data refresh.

From **Group13**, with the parking services stopped:

**Windows:**

```powershell
Set-Location .\local-app
.\setup.ps1
.\start.ps1
```

**Linux:**

```bash
cd local-app
chmod +x setup.sh start.sh start-fuseki.sh start-app.sh
./setup.sh
./start.sh
```

Setup imports the **already generated** RDF and included snapshots; it does not rerun OpenRefine or execute the RML mappings. Its temporary import server uses port 3031 and stops afterward. Normal Fuseki queries use port 3030; the web application is at **http://127.0.0.1:8080**.

Wait for Fuseki's `Start Fuseki` message. Keep the launcher open; Ctrl+C stops both services. On Linux, use normal termination rather than `kill -9`, which cannot trigger Bash cleanup. The local runtime/database is generated and ignored by Git; do not copy it between operating systems.

### A coherent team demonstration

1. Show an original CSV row and its cleaned equivalent. Explain decimal conversion, types, and monthly granularity.
2. Show the ontology's four classes and explain why an observation is its own resource.
3. Show a subject template and a predicate-object map. Point to the corresponding generated triples.
4. Show the OpenRefine reconciliation history, the linked CSV column, and the resulting `owl:sameAs` triple.
5. Show the separate Wikidata `P47` snapshot and coordinate RDF. Distinguish external identity matching from later fact retrieval.
6. In the app, select **PLAZA MAYOR / January / Average / Overall**. The included dataset's documented result is **47.4125% from eight observations**, displayed as **47.4%**. Change to **January 2025** to show the exact **49.9%** observation instead.
7. Open the bordering-district alternatives and map, then the query inspector. Trace the reviewed -> Wikidata -> reviewed join and the optional geography join.
8. Finish with one limitation: historical occupancy is not a prediction or real-time vacancy.

The [application's recorded verification notes](local-app/README.md#verified-examples-for-this-implementation) include a disposable graph-removal check: removing border triples reduced the PLAZA MAYOR January comparison from 45 related facilities to 24 selected/same-district facilities. That demonstrates that graph relationships affect behavior; it is not an instruction to delete triples during the live presentation.

## 13. Questions the team should be ready to answer

| Question | Short answer |
|---|---|
| Is the ontology the final RDF dataset? | No. It defines terms; the generated RDF contains the instances and observations using those terms. Both can use Turtle syntax. |
| Is RML the same as RDF or TTL? | No. RML defines conversion rules; RDF is the graph model; Turtle is a serialization used for mappings and/or data. |
| Did OpenRefine supply the district borders? | No. It identified districts. The application later retrieved `P47` facts using those identifiers. |
| What does reconciliation add beyond cleaning? | Cleaning standardizes text/values; reconciliation identifies a real-world entity in an external dataset. |
| Are the Wikidata links just hyperlinks? | No. Their IRIs participate in SPARQL joins that determine eligible alternatives. |
| Does `owl:sameAs` mean the districts are neighbors? | No. It asserts identity. `P47` connects different entities that share a border. |
| Are there three live APIs in each query? | No. Normal queries join three local named graphs in Fuseki. External services are used when fetching/refreshing snapshots. |
| Did Madrid Geoportal return RDF? | No. It returned GeoJSON; our script generated RDF coordinates for accepted facility matches. |
| Are all map data RDF? | No. Coordinates are RDF; district polygon shapes are GeoJSON; optional street tiles are just a visual background. |
| Did app development modify the reviewed linked RDF? | No. Supplemental data live separately, and setup checks the source fingerprint. |
| Are all 62 facilities mapped? | No. There are 57 accepted coordinate matches; the rest still appear in the lists. |
| Does every triple need its own new local resource? | No. Reusing the same facility/district URI connects facts across rows, observations, and sources. |
| Did the ontology automatically validate or infer everything? | No. This app uses explicit queries and application checks, without OWL reasoning or SHACL validation. |
| Does lower occupancy mean a free space now? | No. It describes historical monthly measurements, with coverage and data-quality limitations. |

### Attribution and an honest closing statement

The [source analysis](analysis.html) records CC BY 4.0 for the Madrid occupancy data and the generated dataset. Preserve the original source attribution and disclose transformations. The Wikidata snapshot records CC0; municipal geography has its own source/usage metadata. Do not assume one source's license automatically covers every enrichment.

> Our result is an end-to-end linked-data workflow: source analysis, cleaning, semantic modeling, declarative RDF generation, entity reconciliation, explicit linking, separately sourced enrichment, and a working SPARQL-driven application. Its value is that the links and graph relationships are operational inputs to the comparison, while provenance and historical-data limitations remain visible.
