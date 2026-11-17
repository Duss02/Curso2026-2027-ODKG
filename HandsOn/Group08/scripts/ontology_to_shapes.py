"""Generate draft SHACL shapes from the HeatRelief ontology.

Same approach as Astrea (https://astrea.linkeddata.es/), which was not
reachable when we did this hands-on:
  - one sh:NodeShape per owl:Class, targeting that class;
  - one sh:PropertyShape per property with an rdfs:domain, attached to the
    shape of its domain class;
  - object properties  -> sh:nodeKind sh:IRI     + sh:class    <range>
  - datatype properties -> sh:nodeKind sh:Literal + sh:datatype <range>

No cardinalities are generated: they cannot be derived from domain/range.

Usage: python scripts/ontology_to_shapes.py  (from HandsOn/Group08)
"""
from pathlib import Path

from rdflib import BNode, Graph, Namespace, URIRef
from rdflib.namespace import OWL, RDF, RDFS, SH

BASE = Path(__file__).resolve().parent.parent
ONTOLOGY = BASE / "ontology" / "HeatRelief.ttl"
OUT = BASE / "shacl" / "shapes-draft.ttl"

HRS = Namespace("https://w3id.org/barcelona-heat-relief/shapes#")


def local(uri: URIRef) -> str:
    s = str(uri)
    return s.rsplit("#", 1)[-1].rsplit("/", 1)[-1]


def main() -> None:
    onto = Graph(bind_namespaces="none").parse(ONTOLOGY)
    shapes = Graph()
    shapes.bind("sh", SH)
    shapes.bind("hrs", HRS)
    for prefix, ns in onto.namespaces():
        if prefix in {"hr", "geo", "xsd", "rdfs", "skos"}:
            shapes.bind(prefix, ns, replace=True)

    node_shape = {}
    for cls in sorted(onto.subjects(RDF.type, OWL.Class)):
        if isinstance(cls, BNode):
            continue
        ns_ = HRS[local(cls) + "Shape"]
        node_shape[cls] = ns_
        shapes.add((ns_, RDF.type, SH.NodeShape))
        shapes.add((ns_, SH.targetClass, cls))

    for kind, node_kind, range_pred in (
        (OWL.ObjectProperty, SH.IRI, SH["class"]),
        (OWL.DatatypeProperty, SH.Literal, SH.datatype),
    ):
        for prop in sorted(onto.subjects(RDF.type, kind)):
            domain = onto.value(prop, RDFS.domain)
            rng = onto.value(prop, RDFS.range)
            if domain not in node_shape:
                continue
            ps = HRS[local(domain) + "-" + local(prop)]
            shapes.add((node_shape[domain], SH.property, ps))
            shapes.add((ps, RDF.type, SH.PropertyShape))
            shapes.add((ps, SH.path, prop))
            shapes.add((ps, SH.nodeKind, node_kind))
            if rng is not None:
                shapes.add((ps, range_pred, rng))

    OUT.parent.mkdir(exist_ok=True)
    shapes.serialize(OUT, format="turtle")
    print(f"{len(node_shape)} node shapes, "
          f"{len(set(shapes.subjects(RDF.type, SH.PropertyShape)))} property shapes "
          f"-> {OUT.relative_to(BASE)}")


if __name__ == "__main__":
    main()
