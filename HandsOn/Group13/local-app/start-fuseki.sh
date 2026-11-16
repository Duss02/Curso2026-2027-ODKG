#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$script_dir"

jar="$script_dir/runtime/apache-jena-fuseki-6.2.0/fuseki-server.jar"
if [[ ! -f "$jar" || ! -f runtime/source.json ]]; then
    printf 'Run setup.sh first, with both services stopped.\n' >&2
    exit 1
fi

export FUSEKI_BASE="$script_dir/runtime/fuseki"
exec java -jar "$jar" --localhost --port=3030 --config=fuseki-config.ttl
