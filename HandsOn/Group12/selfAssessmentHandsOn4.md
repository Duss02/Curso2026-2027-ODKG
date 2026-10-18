# Hands-on assignment 4 – Self assessment

## Checklist

**Every RDF file:**

- [X] Uses the .ttl extension
- [X] Is serialized in the Turtle format
- [X] Follows the resource naming strategy
- [X] Uses class and property URIs that are the same as those used in the ontology

**Every URI in the RDF files:**

- [X] Is "readable" and has some meaning (e.g., it is not an auto-increased integer)
- [X] Is not encoded as a string
- [X] Does not contain a double slash (i.e., "//")

**Every individual in the RDF files:**

- [X] Has a label with the name of the individual
- [X] Has a type

**Every value in the RDF files:**

- [X] Is trimmed
- [X] Is properly encoded (e.g., dates, booleans)
- [X] Includes its datatype
- [X] Uses the correct datatype (e.g., values of 0-1 may be booleans and not integers, not every string made of numbers is a number)

## Comments on the self-assessment
The RML mappings and data transformation pipeline were successfully executed using Morph-KGC over the updated CSV datasets (`open_classes-updated.csv`, `closed_classes-updated.csv`, and `sports_centers_info-updated.csv`).

Key quality and compliance aspects verified:
- **Dataset Scale & Coverage:** The resulting knowledge graph (`active_madrid_data.ttl`, 94.7 MB) contains **1,111,535 triples** modeling 150,111 sports classes, 82 sports centers, 21 districts, 485 sports activities, and 506 time intervals.
- **Cross-Dataset Linking (`am:takesPlaceAt`):** Through the normalization of sports center names with the uniform `"Centro Deportivo Municipal "` prefix, the interlinking between sports classes and sports facilities was completely resolved, producing **137,878 `am:takesPlaceAt` object property assertions**.
- **URI & Structural Compliance:** All subject and object URIs strictly comply with the resource naming strategy (`https://w3id.org/active-madrid/resource/...`). Automated validation via PyOxigraph confirmed **zero instances of duplicate slashes (`//`)** and **zero unlabeled individuals** (all entities possess an explicit `rdf:type` and `schema:name`).
- **Literal Typing:** Capacity values (`am:offeredPlaces`, `am:occupiedPlaces`, `am:availablePlaces`) are explicitly typed as `xsd:nonNegativeInteger`, geographic coordinates as `xsd:decimal`, and temporal bounds (`time:inXSDTime`) as `xsd:time`.
- **SPARQL Verification & Script Cleanup:** A suite of 11 competency and analytical SPARQL queries (`queries.sparql`) was thoroughly executed and verified using an automated Python validation script (`comprobacion_queries.py` with PyOxigraph), confirming valid syntax, response times, and meaningful domain results across all queries. Once this rigorous verification was completed, the auxiliary testing script was removed from the repository to ensure that only the required assignment deliverables remain in the folder.