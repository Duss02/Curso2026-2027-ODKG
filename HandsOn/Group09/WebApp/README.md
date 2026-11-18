# Madrid Smart Parking Explorer

Web application developed by **Group 09** for the **Open Data and Knowledge Graphs (ODKG), 2026–2027** course.

The application explores municipal parking facilities in Madrid and their historical occupancy through an interactive map, searches, filters, charts, and comparisons. Parking information is retrieved from an **RDF knowledge graph** with **SPARQL queries**, rather than directly from the original CSV files.

## Features

- **Interactive map** of Madrid's municipal parking facilities, with clustered markers.
- **Search** by parking name, PAR code, or district.
- **Filters** by district, parking type, and minimum/maximum number of spaces.
- **Facility details:** name, PAR code, district, neighbourhood, address, type, capacity, operational status, and official information link when available.
- **Historical occupancy** by month and year (available observations span **2019–2026**).
- **Line charts** for general and daytime occupancy, using Chart.js.
- **Comparison of two parking facilities** over the same time period.
- **Statistical summaries and accessible monthly tables** with missing values clearly indicated.
- **Linked Data access:** Turtle representation of a selected facility, its related geographic entities and any associated occupancy observations.
- **External location link** to OpenStreetMap when coordinates are available.

The current RDF dataset contains **301 parking facilities** and **4,754 monthly occupancy observations**. Not every facility has geographic coordinates or historical occupancy data. The application handles those cases explicitly.

## Project structure

The application is located in `HandsOn/Group09/WebApp` within the course repository:

```text
HandsOn/Group09/
├── WebApp/
│   ├── app.py
│   ├── requirements.txt
│   ├── .gitignore
│   ├── README.md
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── script.js
├── rdf/
│   ├── aparcamientos.ttl
│   └── queries.sparql
├── ontology/
├── mappings/
├── csv/
└── requirements/
```

`app.py` reads the shared RDF file from **`../rdf/aparcamientos.ttl`**. Do not move the application out of `Group09/WebApp` without updating that path.

## Running locally

**Prerequisites:** Python 3.11 or newer, Git (if cloning the repository), and a modern browser.

Open a terminal in the repository root and enter the application directory:

```powershell
cd HandsOn/Group09/WebApp
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If your local PowerShell session blocks script execution, you can allow activation *for that terminal session only*:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

Run the Flask application:

```powershell
python app.py
```

Open **http://127.0.0.1:5000/** in your browser. Stop the server using `Ctrl+C` in the terminal.

On Linux/macOS, activate the virtual environment with `source .venv/bin/activate` instead.

> **Note:** Flask's development server (`debug=True`) is intended for local development, not public production deployment.

## API endpoints

| Endpoint | Description |
| --- | --- |
| `GET /` | Main application interface |
| `GET /api/resumen` | Number of facilities and RDF triples |
| `GET /api/aparcamientos` | Facilities and their available attributes, as JSON |
| `GET /api/aparcamientos/<codigo>/ocupacion` | Monthly occupancy observations for a facility, as JSON |
| `GET /api/aparcamientos/<codigo>/rdf` | RDF/Turtle subgraph for a facility and its related resources |

Examples:

- http://127.0.0.1:5000/api/aparcamientos/101/ocupacion
- http://127.0.0.1:5000/api/aparcamientos/101/rdf

A nonexistent PAR code returns an HTTP `404` response for the facility-specific API endpoints. An existing facility without occupancy records returns an empty observations list.

## RDF and SPARQL integration

The underlying graph, available at `../rdf/aparcamientos.ttl`, was produced from the Group 09 datasets using mapping rules found in `../mappings/`. Its vocabulary is described in `../ontology/ParkingMadrid.ttl`.

SPARQL queries retrieve parking facilities and their geographic properties, while historical observations are linked to their respective facilities through the `pm:isOccupancyOf` property. The Turtle API exports the selected facility's triples, related district/neighbourhood triples, and associated observations.

The ontology's `parking-madrid.example.org` IRIs are **project identifiers on an example domain**; they are not currently published as dereferenceable web resources. The local Turtle endpoint supports exploring the project's RDF, but it does not constitute a public Linked Data deployment. OpenStreetMap links are geographic viewing links, not verified semantic identity links such as `owl:sameAs`.

## Data provenance and attribution

The original datasets are published by the **Ayuntamiento de Madrid (Madrid City Council)**:

1. [Municipal parking facilities / number of spaces](https://datos.gob.es/es/catalogo/l01280796-aparcamientos-municipales-numero-de-plazas1).
2. [Municipal public parking / historical occupancy](https://datos.gob.es/es/catalogo/l01280796-aparcamientos-publicos-municipales-rotacionales-historico-de-ocupacion).

The Group 09 project documentation (`../analysis.html`) identifies **Creative Commons Attribution 4.0 International (CC BY 4.0)** as the source license and describes the subsequent transformation of the data. See [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and check the source portals for the applicable reuse conditions and attribution requirements.

This application uses transformed data prepared for the ODKG course; it is **not an official Madrid City Council service**. Map tiles and geographic basemap data are provided by OpenStreetMap contributors, with attribution displayed in the map.

## Notes and limitations

- The displayed occupancy figures are **historical**, not live parking availability.
- Some facilities do not have coordinates and therefore cannot be plotted on the map.
- Some facilities have no occupancy history; missing months or percentages are displayed as unavailable rather than as zero.
- Percentages exceeding 100% are preserved from the provided RDF and flagged to users rather than silently changed.
- The application uses the existing RDF graph; updates to the source CSV files are **not automatically reflected** until the RDF data is regenerated.

## Course materials

For the dataset analysis, transformation rules, ontology, validation, original requirements and mock-up, see the other files under [`HandsOn/Group09`](../).
