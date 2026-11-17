#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GDB="$(ls -d "$ROOT"/tools/graphdb-*/ 2>/dev/null | sort -V | tail -1)"
if [[ -z "$GDB" ]]; then
  echo "GraphDB non trovato in $ROOT/tools. Vedi README (sezione GraphDB)." >&2
  exit 1
fi
export GDB_HEAP_SIZE="${GDB_HEAP_SIZE:-2g}"
echo "Avvio $GDB → http://localhost:7200"
# Wikidata rifiuta le query federate (SERVICE) con lo user agent generico di Java:
# la sua policy (https://w.wiki/4wJS) chiede un user agent descrittivo con un contatto.
UA="${GDB_USER_AGENT:-LA311-Fieldnotes/1.0 (UPM Open Data and Knowledge Graphs, Group 06; michele.dussin@alumnos.upm.es) GraphDB/11}"
# Passata via JDK_JAVA_OPTIONS (letta dal launcher java, accetta le virgolette): lo script
# bin/graphdb rielabora gli argomenti con eval e si rompe su spazi e parentesi.
export JDK_JAVA_OPTIONS="${JDK_JAVA_OPTIONS:-} \"-Dhttp.agent=$UA\""
exec "$GDB/bin/graphdb" -Dgraphdb.workbench.cors.enable=true
