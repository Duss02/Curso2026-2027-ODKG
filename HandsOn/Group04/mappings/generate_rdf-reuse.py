"""Group04 - Breathe & Play Madrid - Hands-on 6 (ontology reuse)

Runs the RML mappings that reuse the EDINT ontologies (mappings/*-reuse.rml) with
Morph-KGC and writes, for each dataset, one N-Triples file (rdf/*-reuse.nt) and one
Turtle file (rdf/*-reuse.ttl) with the same triples. The mappings read the CSV files
of Hands-on 5 (csv/*-with-links.csv, with the readable names used in the IRIs in the
*_SLUG columns) and the correspondence tables with the EDINT
concepts (csv/edint-environmental-properties.csv, csv/edint-infrastructure-types.csv).

Usage (from the HandsOn/Group04 directory):
    pip install morph-kgc rdflib
    python mappings/generate_rdf-reuse.py

Important: on Windows, set PYTHONUTF8=1 first (cmd/Anaconda Prompt: set PYTHONUTF8=1;
PowerShell: $env:PYTHONUTF8 = "1") so that the mappings are read as UTF-8.
"""
from pathlib import Path

import morph_kgc
from rdflib import XSD, Literal, Namespace

BASE = "https://w3id.org/breatheplay-madrid/resource/"
PREFIXES = {
    "bpm": "https://w3id.org/breatheplay-madrid/ontology#",
    "bpmkos": "https://w3id.org/breatheplay-madrid/kos/",
    "edintmed": "https://edint.es/def/medio-ambiente#",
    "edintinf": "https://edint.es/def/infraestructura#",
    "edintkos-vars": "https://edint.es/kos/EnvironmentalProperty/",
    "edintkos-foi": "https://edint.es/kos/FeaturesOfInterest/",
    "edintkos-sensortypes": "https://edint.es/kos/SensorTypes/",
    "edintkos-inftype": "https://edint.es/kos/InfrastructureType/",
    "esadm": "http://vocab.linkeddata.es/datosabiertos/def/sector-publico/territorio#",
    "esdir": "http://vocab.linkeddata.es/datosabiertos/def/urbanismo-infraestructuras/direccion-postal#",
    "sosa": "http://www.w3.org/ns/sosa/",
    "qudt": "http://qudt.org/schema/qudt/",
    "unit": "http://qudt.org/vocab/unit/",
    "time": "http://www.w3.org/2006/time#",
    "gsp": "http://www.opengis.net/ont/geosparql#",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "schema": "http://schema.org/",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "dct": "http://purl.org/dc/terms/",
    "owl": "http://www.w3.org/2002/07/owl#",
    "wd": "http://www.wikidata.org/entity/",
    "obs": BASE + "observation/",
    "sp": BASE + "sampling-point/",
    "pol": BASE + "pollutant/",
    "factype": BASE + "facility-type/",
    "tech": BASE + "technique/",
    "station": BASE + "station/",
    "sttype": BASE + "station-type/",
    "fac": BASE + "sports-facility/",
    "district": BASE + "district/",
    "nbh": BASE + "neighbourhood/",
    "day": BASE + "day/",
    "instant": BASE + "instant/",
}

DATASETS = [
    "calidad-aire-diario-2024",
    "estaciones-control-aire",
    "instalaciones-deportivas",
]

Path("rdf").mkdir(exist_ok=True)
for name in DATASETS:
    config = f"""
[CONFIGURATION]
na_values=,#N/A,N/A,NULL,null,NaN,nan,None

[{name}]
mappings: mappings/{name}-reuse.rml
"""
    graph = morph_kgc.materialize(config)
    # The mappings declare rr:datatype xsd:string, but plain literals lose it
    # on the way out; make it explicit.
    plain = [(s, p, o) for s, p, o in graph
             if isinstance(o, Literal) and o.datatype is None and o.language is None]
    for s, p, o in plain:
        graph.remove((s, p, o))
        graph.add((s, p, Literal(str(o), datatype=XSD.string)))
    for prefix, uri in PREFIXES.items():
        graph.bind(prefix, Namespace(uri), override=True, replace=True)
    for ext, fmt in (("nt", "nt"), ("ttl", "turtle")):
        out = Path("rdf", f"{name}-reuse.{ext}")
        graph.serialize(destination=out, format=fmt, encoding="utf-8")
        print(f"{out}: {len(graph)} triples")
