"""Paths and parameters for SafeRoute Madrid. Everything else imports from here."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

RAW_DIR = DATA / "raw"              # drop Madrid accident CSVs here (any year)
CLEAN_DIR = DATA / "clean"          # cleaned + enriched CSV per raw file (mapping input)
RDF_DIR = DATA / "rdf"              # N-Triples per raw file (mapping output)
STORE_DIR = DATA / "store"          # Oxigraph triplestore
PROCESSED_DIR = DATA / "processed"  # accidents, segment risk, hotspots for the app
STREETS_DIR = DATA / "streets"      # cached OpenStreetMap networks
MANIFEST = DATA / "manifest.json"   # which raw files are loaded, with their hash

MAPPING = ROOT / "mappings" / "saferoute.rml.ttl"
ONTOLOGY = ROOT / "ontology" / "ontology.ttl"
WIKIDATA_LOOKUP = DATA / "links" / "wikidata_lookup.csv"
QUERIES_DIR = ROOT / "queries"

# Namespaces (resource naming strategy from analysis.html)
BASE = "https://w3id.org/saferoutemadrid/"
NS = BASE + "ontology#"
RES = BASE + "resource/"
ONTOLOGY_GRAPH = BASE + "graph/ontology"
DATA_GRAPH_PREFIX = BASE + "graph/data/"   # + raw file stem, one named graph per CSV

# Madrid municipality, generous bounding box (WGS84)
MADRID_BBOX = {"west": -3.90, "south": 40.30, "east": -3.50, "north": 40.65}
UTM_EPSG = 25830   # ETRS89 / UTM zone 30N, used by the Madrid accident files

# Columns every accident CSV must have (Madrid open data portal schema)
REQUIRED_COLUMNS = [
    "num_expediente", "fecha", "hora", "localizacion", "numero", "cod_distrito", "distrito",
    "tipo_accidente", "estado_meteorológico", "tipo_vehiculo", "tipo_persona", "rango_edad",
    "sexo", "cod_lesividad", "lesividad", "coordenada_x_utm", "coordenada_y_utm",
    "positiva_alcohol", "positiva_droga",
]

# App vehicle profiles -> Madrid vehicle categories counted as "same kind of vehicle".
# Categories not listed still count for every profile through ALL_VEHICLES_WEIGHT.
VEHICLE_PROFILES = {
    "Car": ["Turismo", "Todo terreno", "Furgoneta", "Autocaravana", "Cuadriciclo ligero",
            "Cuadriciclo no ligero", "Otros vehículos con motor", "Caravana"],
    "Motorcycle": ["Motocicleta hasta 125cc", "Motocicleta > 125cc", "Ciclomotor",
                   "Ciclomotor de dos ruedas L1e-B", "Ciclomotor de tres ruedas",
                   "Ciclo de motor L1e-A", "Moto de tres ruedas hasta 125cc",
                   "Moto de tres ruedas > 125cc"],
    "Heavy vehicle": ["Camión rígido", "Tractocamión", "Semiremolque", "Remolque",
                      "Vehículo articulado", "Maquinaria de obras", "Maquinaria agrícola",
                      "Camión de bomberos"],
    "Bus": ["Autobús", "Autobus EMT", "Autobús articulado", "Autobús articulado EMT",
            "Microbús <= 17 plazas"],
    "Bicycle": ["Bicicleta", "Bicicleta EPAC (pedaleo asistido)", "Ciclo", "VMU eléctrico",
                "Patinete no eléctrico", "Otros vehículos sin motor"],
}
# Which OSM network each profile routes on
PROFILE_NETWORK = {"Car": "drive", "Motorcycle": "drive", "Heavy vehicle": "drive",
                   "Bus": "drive", "Bicycle": "bike"}
# Average urban speeds (km/h) for travel-time estimates
PROFILE_SPEED_KMH = {"Car": 25, "Motorcycle": 27, "Heavy vehicle": 20, "Bus": 18, "Bicycle": 14}

# Risk model
SAME_VEHICLE_WEIGHT = 1.0    # accident involving the selected vehicle kind
ALL_VEHICLES_WEIGHT = 0.35   # any other accident on that street segment
# Injury severity (cod_lesividad) -> weight; 14 = no medical assistance, 4 = fatal
SEVERITY_WEIGHT = {"4": 10.0, "3": 5.0, "1": 2.0, "2": 2.0, "5": 2.0, "6": 2.0,
                   "7": 1.2, "14": 1.0}
DEFAULT_SEVERITY_WEIGHT = 1.0
MAX_SNAP_METERS = 40         # accidents further than this from any street are ignored
SAFE_ROUTE_PENALTY_SECONDS = 60.0  # safe-route cost: each unit of segment risk = 1 extra minute
SAFE_ROUTE_MAX_DETOUR = 1.6  # never suggest a safe route longer than 1.6x the fastest
HOTSPOT_MIN_ACCIDENTS = 5    # a segment needs at least this many to be shown as a hotspot
# Route level = route risk per km / Madrid average (all streets, including quiet ones, so any
# through route is above 1): < 1.5 Low, < 3 Medium, else High
LEVEL_LOW, LEVEL_HIGH = 1.5, 3.0
