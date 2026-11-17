"""Validate the knowledge graph against shacl/shapes.ttl with pySHACL.

The data graph is the ontology plus the four -with-links RDF files (the
graph published in GraphDB). The validation report is written to
shacl/report.ttl and a summary of the violations is printed.

Usage: python scripts/validate_shacl.py  (from HandsOn/Group08)
"""
import time
from collections import Counter
from pathlib import Path

from pyshacl import validate
from rdflib import Graph
from rdflib.namespace import SH

BASE = Path(__file__).resolve().parent.parent
DATA = [
    "ontology/HeatRelief.ttl",
    "rdf/xarxa-refugis-climatics-with-links.ttl",
    "rdf/fonts-beure-2026-with-links.ttl",
    "rdf/arbrat-viari-with-links.ttl",
    "rdf/areas-with-links.ttl",
]
SHAPES = BASE / "shacl" / "shapes.ttl"
REPORT = BASE / "shacl" / "report.ttl"


def main() -> None:
    t0 = time.time()
    data = Graph()
    for f in DATA:
        data.parse(BASE / f)
    print(f"data graph: {len(data)} triples ({time.time() - t0:.0f} s)")

    conforms, report, _ = validate(
        data,
        shacl_graph=Graph().parse(SHAPES),
        inference="none",
        abort_on_first=False,
        allow_warnings=True,
    )
    report.bind("sh", SH)
    report.serialize(REPORT, format="turtle")
    print(f"conforms: {conforms} ({time.time() - t0:.0f} s) -> {REPORT.relative_to(BASE)}")

    results = list(report.subjects(predicate=SH.resultSeverity))
    print(f"results: {len(results)}")
    by_kind = Counter(
        (str(report.value(r, SH.resultPath)), str(report.value(r, SH.sourceConstraintComponent)).split("#")[-1])
        for r in results
    )
    for (path, comp), n in by_kind.most_common():
        print(f"  {n:6d}  {comp:32s} {path}")
    for r in results[:15]:
        print("   -", report.value(r, SH.focusNode), "|", report.value(r, SH.resultMessage))


if __name__ == "__main__":
    main()
