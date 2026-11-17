"""Group04 - Breathe & Play Madrid - SHACL validation (own ontology)

Validates the RDF generated from our own ontology (ontology/breatheplay.ttl)
against our own SHACL shapes (shacl/shapes.ttl), and writes the validation
report to shacl/report.ttl.

Usage (from the HandsOn/Group04 directory):
    pip install rdflib pyshacl
    python validate_shacl.py
"""
import time
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

SHAPES = Path("shacl/shapes.ttl")
DATA = [
    Path("ontology/breatheplay.ttl"),
    Path("rdf/estaciones-control-aire.ttl"),
    Path("rdf/instalaciones-deportivas.ttl"),
    Path("rdf/calidad-aire-diario-2024.ttl"),
]
REPORT = Path("shacl/report.ttl")

shapes = Graph()
shapes.parse(SHAPES, format="turtle")
print(f"Shapes: {len(shapes):,} triples")

data = Graph()
for path in DATA:
    start = time.time()
    data.parse(path, format="turtle")
    print(f"Loaded {path} ({time.time() - start:.1f} s)")
print(f"Data: {len(data):,} triples")

start = time.time()
conforms, report, text = validate(data, shacl_graph=shapes, inference="none")
print(f"\nConforms: {conforms} ({time.time() - start:.1f} s)")
if not conforms:
    print(text)

REPORT.parent.mkdir(exist_ok=True)
report.serialize(destination=REPORT, format="turtle", encoding="utf-8")
print(f"Report written to {REPORT}")
