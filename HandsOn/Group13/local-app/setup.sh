#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$script_dir"

for required in node java curl tar sha512sum setsid; do
    if ! command -v "$required" >/dev/null 2>&1; then
        printf 'Required command not found: %s. See README.md for Linux requirements.\n' "$required" >&2
        exit 1
    fi
done

node --input-type=module - <<'NODE'
import net from 'node:net';
for (const port of [3030, 3031]) {
  const probe = net.createServer();
  probe.on('error', error => {
    console.error(`Cannot use port ${port}: ${error.message}. Stop the parking services before setup.`);
    process.exitCode = 1;
  });
  probe.listen(port, '127.0.0.1', () => probe.close());
}
NODE

version='6.2.0'
jar="$script_dir/runtime/apache-jena-fuseki-$version/fuseki-server.jar"
archive=''
checksum_file=''
maintenance_pid=''
cleanup() {
    local status=$?
    trap - EXIT
    trap '' INT TERM HUP
    if [[ -n "$maintenance_pid" ]]; then
        if ! kill -TERM -- "-$maintenance_pid" 2>/dev/null && kill -0 "$maintenance_pid" 2>/dev/null; then
            if ! kill -TERM "$maintenance_pid" 2>/dev/null && kill -0 "$maintenance_pid" 2>/dev/null; then
                printf 'Unable to stop maintenance process %s.\n' "$maintenance_pid" >&2
                status=1
            fi
        fi
        wait "$maintenance_pid" 2>/dev/null || :
    fi
    if [[ -n "$archive" ]]; then rm -f -- "$archive"; fi
    if [[ -n "$checksum_file" ]]; then rm -f -- "$checksum_file"; fi
    return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

mkdir -p -- runtime
if [[ ! -f "$jar" ]]; then
    archive="$(mktemp "$script_dir/runtime/fuseki-download.XXXXXX")"
    checksum_file="$(mktemp "$script_dir/runtime/fuseki-checksum.XXXXXX")"
    printf 'Downloading Apache Jena Fuseki %s...\n' "$version"
    curl --fail --location --show-error --output "$archive" \
        "https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-$version.tar.gz"
    curl --fail --location --show-error --output "$checksum_file" \
        "https://downloads.apache.org/jena/binaries/apache-jena-fuseki-$version.tar.gz.sha512"
    checksum_text="$(< "$checksum_file")"
    if [[ ! "$checksum_text" =~ (^|[^[:xdigit:]])([[:xdigit:]]{128})([^[:xdigit:]]|$) ]]; then
        printf 'The Fuseki checksum response does not contain a SHA-512 fingerprint.\n' >&2
        exit 1
    fi
    if ! printf '%s  %s\n' "${BASH_REMATCH[2]}" "$archive" | sha512sum --check --status; then
        printf 'Fuseki download failed SHA-512 verification.\n' >&2
        exit 1
    fi
    tar -xzf "$archive" -C runtime
    if [[ ! -f "$jar" ]]; then
        printf 'The Fuseki archive did not provide the expected server JAR.\n' >&2
        exit 1
    fi
fi

export FUSEKI_BASE="$script_dir/runtime/fuseki"
mkdir -p -- runtime/database
set +m
setsid java -jar "$jar" --localhost --port=3031 --tdb2 \
    "--loc=$script_dir/runtime/database" --update /parking \
    >runtime/setup-stdout.log 2>runtime/setup-stderr.log &
maintenance_pid=$!
if ! node data.mjs prepare; then
    printf 'Data preparation failed. Check runtime/setup-stdout.log and runtime/setup-stderr.log.\n' >&2
    exit 1
fi
cleanup
printf 'Setup complete. Run ./start.sh to start both services.\n'
