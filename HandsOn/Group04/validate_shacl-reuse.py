"""Group04 - Breathe & Play Madrid - Hands-on 6 (ontology reuse)

Validates the RDF generated with the EDINT ontologies against the SHACL shapes
published by EDINT, and writes the validation report to shacl/report-reuse.ttl.

    - Data: rdf/*-reuse.ttl and ontology/breatheplay-kos.ttl (own SKOS concepts).
    - Shapes: shapes/shapes.ttl of the EDINT environment (medio-ambiente) and
      infrastructure (infraestructura) repositories.
    - EDINT vocabularies (SKOS): some shapes require that the values are
      skos:Concept (e.g. the sensor type AirQualitySensor). That is stated in the
      EDINT vocabularies, not in our data, so they are loaded together with it,
      as anyone who uses EDINT data would do.

The EDINT files are read from GitHub at a fixed commit (the version we used), so
the result is reproducible even if EDINT changes them later.

Usage (from the HandsOn/Group04 directory, with internet access):
    pip install rdflib pyshacl
    python validate_shacl-reuse.py

It takes about a minute (the air quality file has ~476k triples).
"""
import sys
import time
from collections import Counter
from pathlib import Path

from pyshacl import validate
from rdflib import Graph
from rdflib.namespace import SH

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

GITHUB = "https://raw.githubusercontent.com/EDINT-Ontologia"
MED = f"{GITHUB}/edint-ontologia-medio-ambiente/f33a5d448e808a8da40460a7ba6f144f0b1f8e31"
INF = f"{GITHUB}/edint-ontologia-infraestructura/924d9f28c1e5fec0a4961886373a5ba8f41bb7e1"

SHAPES = [f"{MED}/shapes/shapes.ttl", f"{INF}/shapes/shapes.ttl"]
EDINT_VOCABULARIES = [
    f"{MED}/kos/skos-SensorTypes.ttl",
    f"{MED}/kos/skos-EnvironmentalProperty.ttl",
    f"{MED}/kos/skos-FeaturesOfInterest.ttl",
    f"{INF}/kos/skos-InfrastructureType.ttl",
]
DATA = [
    Path("rdf/estaciones-control-aire-reuse.ttl"),
    Path("rdf/instalaciones-deportivas-reuse.ttl"),
    Path("rdf/calidad-aire-diario-2024-reuse.ttl"),
    Path("ontology/breatheplay-kos.ttl"),
]
REPORT = Path("shacl/report-reuse.ttl")

# 1. Shapes graph
shapes = Graph()
for url in SHAPES:
    shapes.parse(url, format="turtle")
print(f"Shapes: {len(shapes):,} triples, "
      f"{len(set(shapes.subjects(SH.targetClass, None)))} node shapes")

# 2. Data graph: our RDF + our SKOS concepts + the EDINT vocabularies
data = Graph()
for path in DATA:
    start = time.time()
    data.parse(path, format="turtle")
    print(f"Loaded {path} ({time.time() - start:.0f} s)")
for url in EDINT_VOCABULARIES:
    data.parse(url, format="turtle")
print(f"Loaded {len(EDINT_VOCABULARIES)} EDINT vocabularies")
print(f"Data: {len(data):,} triples")

# 3. Classes of our data that are checked by some shape
targets = set(shapes.objects(None, SH.targetClass))
used = {c for c in targets if (None, None, c) in data}
print("Classes validated:", ", ".join(sorted(data.namespace_manager.normalizeUri(c) for c in used)))

# 4. Validation
start = time.time()
conforms, report, text = validate(data, shacl_graph=shapes, inference="none")
print(f"\nConforms: {conforms} ({time.time() - start:.0f} s)")
if not conforms:
    problems = Counter(
        (str(report.value(r, SH.sourceConstraintComponent)).split("#")[-1],
         str(report.value(r, SH.resultPath)))
        for r in report.subjects(None, SH.ValidationResult))
    for (component, path), n in problems.most_common():
        print(f"  {n} x {component} on {path}")

REPORT.parent.mkdir(exist_ok=True)
report.serialize(destination=REPORT, format="turtle", encoding="utf-8")
print(f"Report written to {REPORT}")
