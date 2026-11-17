# Hands-on assignment 3 – Self assessment
Group 04

## Checklist

**Every resource described in the CSV file:**

- [X] Has a unique identifier in a column (not an auto-increased integer)
- [X] Is related to a class in the ontology

**Every class in the ontology:**

- [X] Is related to a resource described in the CSV file

**Every column in the CSV file:**

- [X] Is trimmed
- [X] Is properly encoded (e.g., dates, booleans)
- [X] Is related to a property in the ontology

**Every property in the ontology:**

- [X] Is related to a column in the CSV file

## Comments on the self-assessment

**Deliverables.** One OpenRefine operation history per dataset in `openrefine/` and the resulting CSV in `csv/`:

| Dataset | Operations (`openrefine/`) | Updated CSV (`csv/`) | Rows × columns |
|---|---|---|---|
| D1 Daily air quality 2024 | `calidad-aire-diario-2024-updated.json` (20) | `calidad-aire-diario-2024-csv-updated.csv` | 42,973 × 14 |
| D2 Air quality monitoring stations | `212629-0-estaciones-control-aire-csv-updated.json` (16) | `212629-0-estaciones-control-aire-csv-updated.csv` | 24 × 11 |
| D3 Basic municipal sports facilities | `200215-0-instalaciones-deportivas-csv-csv-updated.json` (52) | `200215-0-instalaciones-deportivas-csv-csv-updated.csv` | 607 × 23 |

**Classes and identifier columns** (`bpm:Place` is the superclass of `bpm:MonitoringStation` and `bpm:SportsFacility`):

*Updated after the evaluation of Hands-on 1–4 ("URIs for individuals should be human-readable and meaningful"):* the identifier of each resource is now a readable name (`*_SLUG` columns: the name in lower case, without accents and with the words joined by `-`), added by the last operations of each history. The source codes are kept in their columns and in the RDF as literals.

| Class | Identifier column (readable name) | Source code (kept) |
|---|---|---|
| `bpm:DailyObservation` | `ESTACION_SLUG` + `CONTAMINANTE_SLUG` + `FECHA` (e.g. `plaza-de-espana-no2-2024-01-15`) — D1 | `OBSERVACION_ID` |
| `bpm:SamplingPoint` | `ESTACION_SLUG` + `CONTAMINANTE_SLUG` (one sampling point per station and pollutant) — D1 | `PUNTO_MUESTREO` |
| `bpm:Pollutant` | `CONTAMINANTE_SLUG` (e.g. `no2`) — D1 | `MAGNITUD` |
| `bpm:MeasurementTechnique` | `TECNICA_SLUG` (e.g. `chemiluminescence`) — D1 | `TECNICA` |
| `bpm:MonitoringStation` | `ESTACION_SLUG` (e.g. `plaza-de-espana`) — D2, and D1 from the station code | `CODIGO` (referenced from `ESTACION_CODIGO` in D1 and `ESTACION_CERCANA` in D3) |
| `bpm:StationType` | `TIPO_SLUG` (e.g. `urban-traffic`) — D2 | `COD_TIPO` |
| `bpm:SportsFacility` | `INSTALACION_SLUG` (name without "Instalación Deportiva Municipal Básica", e.g. `acuario`) — D3 | `PK` |
| `bpm:FacilityType` | `TIPO_ID` (already a readable name, e.g. `calistenia`) — D3 | — |
| `bpm:AccessibilityLevel` | `ACCESIBILIDAD_SLUG` (e.g. `partially-accessible`) — D3 | `ACCESIBILIDAD` |
| `bpm:District` | `DISTRITO_SLUG` (e.g. `barajas`) — D3 | `COD-DISTRITO` |
| `bpm:Neighbourhood` | `BARRIO_SLUG` (only for the neighbourhoods with a code) — D3 | `BARRIO_ID` |

The names were checked to be unique (24 stations, 607 facilities, 21 districts, the neighbourhoods and 131 sampling points).

**Columns and properties.** All 33 properties of the ontology come from a column (25 `bpm:` properties and 8 reused properties from SOSA and WGS84 Geo Positioning), and every column is used either for a property, for an identifier (the `*_SLUG` columns build the URIs) or for a label (`rdfs:label`):

- D1: `FECHA` → `bpm:date`, `VALOR` → `sosa:hasSimpleResult`, `VALIDO` → `bpm:isValid`, `PUNTO_MUESTREO` → `sosa:madeBySensor` / `bpm:samplingPointCode`, `ESTACION_CODIGO` → `sosa:isHostedBy`, `MAGNITUD` → `sosa:observedProperty` / `sosa:observes` / `bpm:pollutantCode`, `UNIDAD` → `bpm:unit`, `TECNICA` → `bpm:usesTechnique` / `bpm:techniqueCode`; `CONTAMINANTE` and `TECNICA_NOMBRE` are labels.
- D2: `CODIGO` → `bpm:stationCode`, `DIRECCION` → `bpm:address`, `ALTITUD` → `geo:alt`, `FECHA_ALTA` → `bpm:startDate`, `COD_TIPO` → `bpm:hasStationType`, `LATITUD` / `LONGITUD` → `geo:lat` / `geo:long`; `ESTACION` and `NOM_TIPO` are labels.
- D3: `PK` → `bpm:facilityId`, `TIPO_ID` → `bpm:hasFacilityType`, `EQUIPAMIENTO` → `bpm:equipment`, `TRANSPORTE` → `bpm:transportInfo`, `ACCESIBILIDAD` → `bpm:hasAccessibilityLevel`, `CONTENT-URL` → `bpm:contentURL`, `DIRECCION` → `bpm:address`, `CODIGO-POSTAL` → `bpm:postalCode`, `COD-DISTRITO` → `bpm:locatedInDistrict` / `bpm:districtCode` / `bpm:isPartOfDistrict`, `BARRIO_ID` → `bpm:locatedInNeighbourhood` / `bpm:neighbourhoodCode`, `LATITUD` / `LONGITUD` → `geo:lat` / `geo:long`, `ESTACION_CERCANA` → `bpm:hasNearestStation`, `DISTANCIA_ESTACION_KM` → `bpm:distanceToNearestStation`; `NOMBRE`, `TIPO_NOMBRE`, `ACCESIBILIDAD_NOMBRE`, `DISTRITO` and `BARRIO` are labels.

**Main cleaning and transformation steps:**

- D1: the source has one row per station, pollutant and month, with 31 value columns (`D01`–`D31`) and 31 validity columns (`V01`–`V31`). It was transposed to one row per sampling point and day, and the 768 rows of non-existent dates (e.g., 30 February) were removed. Dates are in ISO format (`yyyy-mm-dd`), the validity flag `V`/`N` is a boolean (`true`/`false`, 700 values not valid), technique codes are zero-padded (`8` → `08`), and pollutant and technique names and units were added from the dataset documentation.
- D2: only the columns used by the ontology were kept; start dates are in ISO format and coordinates are in decimal degrees (WGS84).
- D3: imported as ISO-8859-1. Double-escaped HTML entities were decoded (e.g., `&amp;uuml;` → `ü`), wrong district codes were recalculated from the district name, cells containing the placeholder "DISTRITO" were emptied, neighbourhood name variants and codes were corrected (PESETA → ABRANTES, code 117), and a longitude with the wrong sign was fixed (PK 50334831). The district, neighbourhood and postal code were completed for the 28 facilities where they were missing or inconsistent (checked against the codes used in the rest of the dataset and the facility coordinates); these values are applied by the last five operations of the history (one Jython transform per column, keyed by `PK`), so the JSON reproduces the CSV. After this, every facility has a district; 8 facilities have no neighbourhood code (6 facilities in AMBROZ and SAN ANDRES, which appear without a code in the source data, and 2 facilities with no neighbourhood). Two columns were added with a Jython expression: the nearest monitoring station (`ESTACION_CERCANA`) and its distance in km (`DISTANCIA_ESTACION_KM`), which link D3 with D2.
- All text cells are trimmed and decimal values use a dot as decimal separator.
