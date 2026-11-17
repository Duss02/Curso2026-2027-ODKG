# SHACL validation

We validated the knowledge graph published in GraphDB (ontology + the four `rdf/*-with-links.ttl` files) with SHACL, using the validator [pySHACL](https://github.com/RDFLib/pySHACL).

| File | Content |
|---|---|
| `shapes.ttl` | the SHACL shapes |
| `report.ttl` | final validation report: the graph conforms |
| `report-before.ttl` | report of the first validation, with the problems we found |
| `shapes-draft.ttl` | first shapes, generated from the ontology |

## Shapes

Astrea was not reachable, so `scripts/ontology_to_shapes.py` generates the first shapes from the ontology in the same way (one shape per class, `sh:class` / `sh:datatype` from `rdfs:range`). We then added what the ontology cannot say: cardinalities (e.g. every element is in exactly one neighbourhood), coordinates inside Barcelona, labels in Catalan, allowed tree categories, the format of e-mails, websites and telephones, and the Wikidata links (`owl:sameAs`, or `skos:broadMatch` for cultivars).

## Problems found and fixes

The first validation found 20 violations:

| Problem | Fix |
|---|---|
| 8 shelters have the telephone `010` | not an error: 010 is the information line of Barcelona city council. We changed the shape to accept it. |
| 11 trees have an address without street, e.g. `", 11"` (already in the source CSV) | In the mapping we take the street from the nearest tree with the same number: 8 addresses recovered (e.g. `"Av Diagonal, 607"`). For the other 3 the street is not clear, so the address is left out. |
| 1 tree has no neighbourhood (empty in the source CSV) | In the mapping the tree gets the neighbourhood of the nearest trees (el Besòs i el Maresme). |

The data fixes are in `mappings/arbrat-viari-with-links.rml`, and `rdf/arbrat-viari-with-links.ttl` was regenerated with Morph-KGC. After the fixes the graph conforms (`report.ttl`).

Because of the tree fix, CQ5 changes for Sant Martí (5,120 → 5,121 trees): `graphdb/query-result-cq5.csv` was exported again. **GraphDB must be reloaded with the new `rdf/arbrat-viari-with-links.ttl`.**

## How to run

From `HandsOn/Group08` (`pip install pyshacl`):

```
python scripts/ontology_to_shapes.py   # first shapes from the ontology
python scripts/validate_shacl.py       # validation, writes shacl/report.ttl (about 5 minutes)
```
