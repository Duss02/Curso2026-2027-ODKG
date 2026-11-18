#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] < 3) )); then
    printf 'This launcher requires Bash 4.3 or later.\n' >&2
    exit 1
fi
for required in node java setsid; do
    if ! command -v "$required" >/dev/null 2>&1; then
        printf 'Required command not found: %s. See README.md for Linux requirements.\n' "$required" >&2
        exit 1
    fi
done

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$script_dir"
if [[ ! -f runtime/source.json ]]; then
    printf 'Run setup.sh first, with both services stopped.\n' >&2
    exit 1
fi

web_port="${PORT-8080}"
node --input-type=module - 3030 "$web_port" <<'NODE'
import net from 'node:net';
const ports = process.argv.slice(2);
if (ports.some(value => !/^[0-9]+$/.test(value) || Number(value) < 1 || Number(value) > 65535)) {
  console.error('PORT must be a valid TCP port.');
  process.exit(1);
}
if (Number(ports[0]) === Number(ports[1])) {
  console.error('PORT must differ from the Fuseki port (3030).');
  process.exit(1);
}
for (const value of ports) {
  const probe = net.createServer();
  probe.on('error', error => {
    console.error(`Cannot use port ${value}: ${error.message}. Stop the existing service first.`);
    process.exitCode = 1;
  });
  probe.listen(Number(value), '127.0.0.1', () => probe.close());
}
NODE

service_pids=()
cleanup() {
    local status=$?
    trap - EXIT
    trap '' INT TERM HUP
    if (( ${#service_pids[@]} )); then
        printf '\nStopping both parking services...\n'
    fi
    local pid
    for pid in "${service_pids[@]}"; do
        # A signal can arrive before setsid has established the service's process group.
        if ! kill -TERM -- "-$pid" 2>/dev/null && kill -0 "$pid" 2>/dev/null; then
            if ! kill -TERM "$pid" 2>/dev/null && kill -0 "$pid" 2>/dev/null; then
                printf 'Unable to stop service process %s.\n' "$pid" >&2
                status=1
            fi
        fi
    done
    for pid in "${service_pids[@]}"; do
        # Nonzero status is expected after signalling a service or observing its failure.
        wait "$pid" 2>/dev/null || :
    done
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# Without shell job control, each setsid PID is also its new process-group ID.
set +m
setsid bash "$script_dir/start-fuseki.sh" &
service_pids+=("$!")
setsid bash "$script_dir/start-app.sh" &
service_pids+=("$!")

printf "Starting Fuseki and the web app. Open http://127.0.0.1:%s once Fuseki reports 'Start Fuseki'.\n" "$web_port"
printf 'Keep this launcher running. Press Ctrl+C to stop both services.\n'

if wait -n "${service_pids[@]}"; then
    printf 'A parking service stopped unexpectedly. Shutting down both services.\n' >&2
    exit 1
else
    status=$?
    printf 'A parking service failed (exit %s). Shutting down both services.\n' "$status" >&2
    exit "$status"
fi
