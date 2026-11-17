#!/usr/bin/env bash
# Crea il repository "la311" e carica il Knowledge Graph del Group 06 nel default graph.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GDB_URL="${GDB_URL:-http://localhost:7200}"
REPO="${REPO:-la311}"
DATA="${1:-$ROOT/../Curso2026-2027-ODKG/HandsOn/Group06/rdf/MyLA311_2025-with-links.ttl}"

echo "· Attendo GraphDB su $GDB_URL…"
for _ in $(seq 1 60); do
  curl -sf "$GDB_URL/rest/repositories" >/dev/null && break
  sleep 2
done

if curl -sf "$GDB_URL/rest/repositories" | grep -q "\"id\":\"$REPO\""; then
  echo "· Il repository '$REPO' esiste già: lo svuoto per ricaricare i dati."
  curl -sf -X DELETE "$GDB_URL/repositories/$REPO/statements"
else
  echo "· Creo il repository '$REPO'"
  curl -sf -X POST "$GDB_URL/rest/repositories" -F "config=@$ROOT/graphdb/repo-config.ttl"
fi

echo "· Carico $(basename "$DATA") ($(du -h "$DATA" | cut -f1))…"
curl -sf -X POST -H 'Content-Type: text/turtle' --data-binary "@$DATA" \
  "$GDB_URL/repositories/$REPO/statements"

RESP=$(curl -s -H 'Accept: application/sparql-results+json' --data-urlencode \
  'query=SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }' "$GDB_URL/repositories/$REPO")
if ! N=$(printf '%s' "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin)["results"]["bindings"][0]["n"]["value"])' 2>/dev/null); then
  echo "✗ GraphDB ha rifiutato la query di verifica: $RESP" >&2
  echo "  Se dice 'No license was set': copia il file della licenza Free in tools/graphdb-*/conf/graphdb.license e riavvia." >&2
  exit 1
fi
echo "✓ Repository '$REPO' pronto: $N triple."
echo "  Workbench: $GDB_URL   ·   Endpoint SPARQL: $GDB_URL/repositories/$REPO"
