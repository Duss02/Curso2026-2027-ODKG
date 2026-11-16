Course 2026-2027-ODKG Group 6
=============================
Group members:
- Numidia Nimhaoulin (numidia17)
- Camille Rouzaud (Marcelo Uliaduz)
- Edgar Barrios (Eddregon)
- Ludwig Schmidt (ludwigschdt)

Our dataset (./csv/DBtrainrides.csv) is too large to upload it on GitHub (772 MB), so we only took the first 1000 lines of it.
The original is available at https://www.kaggle.com/datasets/nokkyu/deutsche-bahn-db-delays.
It is licensed under the MIT-License.

Transformation and resource naming
----------------------------------
The cleaned and linked CSVs both contain `state_slug`, `city_slug` and
`station_slug`. Station URIs use `resource/Station/{station_slug}`; their labels
use the `station` column without a `Station:` prefix. EVA numbers remain stored
as `evaNumber` properties. Reconciliation can change names and therefore slugs.

Apply `openrefine/DBtrainrides-cleaning-history.json` to the base CSV to reproduce
the cleaning. Apply `lodrefine/operations-with-links.json` to the cleaned CSV
containing all three slugs to replay reconciliation, corrections and slug updates.
The reconciliation history uses `https://wikidata-reconciliation.wmcloud.org/en/api`.

From `Group07`, regenerate the graphs after updating the CSVs or mappings:
```bash
python transformation/generate_graph.py
python transformation/generate_graph.py --with-links
python transformation/validate_shacl.py
```

Application setup
-----------------
The application uses GraphDB to host the knowledge graph. GraphDB runs in Docker.

1. Start GraphDB from the `app/` folder:
   ```bash
   cd app
   docker compose up -d
   ```
   The Workbench is then available at http://localhost:7200.

2. The `graphdb-init` service creates the repository `db-delays` automatically
   (ruleset `rdfsplus-optimized`, `owl:sameAs` reasoning disabled) and loads
   `ontology/db-delays.ttl` and `rdf/knowledge-graph-with-links.ttl` into it.
   Check its output with `docker compose logs graphdb-init`.
   If the repository already contains data, nothing is imported. To reload after the
   knowledge graph changed, delete the data volume and start again:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

The SPARQL endpoint used by the app is http://localhost:7200/repositories/db-delays.

3. Start the frontend:
   ```bash
   cd app/web
   python -m http.server 8000
   ```
   Then open http://localhost:8000 (opening `index.html` directly as a file does not work).
