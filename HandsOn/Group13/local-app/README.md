### Requirements

- Windows with PowerShell 7, or Linux with Bash 4.3 or later.
- On Linux: `curl`, `tar`, `sha512sum`, and `setsid` (from `util-linux`), plus standard core utilities.
- Node.js 22 or later: `node --version`.
- Java 21 or later: `java -version`.
- The containing Group13 folder, including its reviewed [rdf/aparcamientos-with-links.ttl](../rdf/aparcamientos-with-links.ttl) file.
- Internet for the initial Fuseki download, or when deliberately refreshing external snapshots.

There are no npm dependencies, frontend build step, Docker requirement, cloud account, or mandatory online map tiles. Leaflet 1.9.4 is vendored locally, together with its license.

### First setup, or reload after an update

From the cloned repository root, enter the application directory, with the parking services stopped.

**Windows (PowerShell):**

```powershell
Set-Location '.\HandsOn\Group13\local-app'
.\setup.ps1
```

**Linux (Bash):**

```bash
cd HandsOn/Group13/local-app
chmod +x setup.sh start.sh start-fuseki.sh start-app.sh
./setup.sh
```

The `chmod` step ensures the shell scripts are executable even if file permissions were not preserved by a Windows checkout. Alternatively, invoke them with `bash setup.sh` and `bash start.sh`. The local `.gitattributes` keeps shell scripts in Linux-compatible LF line endings.

The clone can live anywhere and its root folder can have any name. JavaScript resolves local files relative to its modules; PowerShell and Bash scripts resolve paths from their own directory, including paths containing spaces. No user-specific absolute filesystem paths are required. The ignored `runtime` directory is created locally by setup and should not be committed or copied between clones or operating systems.

Setup downloads standalone Apache Jena Fuseki 6.2.0 if necessary (`.zip` on Windows, `.tar.gz` on Linux), checks the archive against Apache's SHA-512 checksum, starts a temporary loopback-only maintenance server, and imports three graphs:

1. The reviewed parking Turtle file, directly.
2. The included Wikidata snapshot.
3. The included verified parking-coordinate snapshot.

It verifies source identity coverage, reports source counts, records a SHA-256 integrity fingerprint, and stops its temporary server. Local district polygons are served as a visualization asset rather than loaded into the RDF store.

Existing users of the earlier application should also rerun setup: the geography graph is new.

### Start the services

Run a single launcher from the application directory.

**Windows:**

```powershell
.\start.ps1
```

**Linux:**

```bash
./start.sh
```

The Windows launcher starts `start-fuseki.ps1` and `start-app.ps1` as background PowerShell jobs. The Linux launcher starts `start-fuseki.sh` and `start-app.sh` in separate background process groups. Both display the services' output in the launcher's terminal. Wait for Fuseki's `Start Fuseki` message, then open **http://127.0.0.1:8080**.

**Press Ctrl+C in the launcher to stop both services and their child processes.** If either service fails, the launcher stops the other rather than leaving half the application running. On Windows, the workers and their native descendants belong to a kill-on-close job object: force-terminating the launcher process also stops its services. The existing PowerShell terminal is not enrolled in that object.

On Linux, the launcher handles `SIGINT` (Ctrl+C), `SIGTERM` (normal `kill`), and `SIGHUP` by terminating its service process groups and waiting for their main processes to exit. Unlike the Windows job object, Bash cannot intercept `SIGKILL` (`kill -9`), so forcibly killing only the Linux launcher that way can leave its services running. Use Ctrl+C or normal `kill` for routine shutdown.

The launcher refuses occupied service ports; it never terminates an independently started server. Keep it running while using the app. It does not run first-time setup automatically.

For manual debugging, you can still start the services in separate terminals:

**Windows:**

```powershell
.\start-fuseki.ps1
# In a second terminal:
.\start-app.ps1
```

**Linux:**

```bash
./start-fuseki.sh
# In a second terminal:
./start-app.sh
```

In manual mode, stop each terminal with Ctrl+C yourself. Do not open the HTML directly from disk; the application needs its local API and RDF database.

| Port | Service |
|---|---|
| 8080 | Web page and read-only application API |
| 3030 | Normal Fuseki query service |
| 3031 | Temporary writable import service; setup only |

The normal parking dataset endpoint is query-only. Graph writes are performed only by the controlled maintenance/import process. All supplied services bind to loopback and are intended for local use, not deployment to an untrusted network.

### Optional settings

Use another web port:

```powershell
$env:PORT = '8081'
.\start.ps1
```

On Linux:

```bash
PORT=8081 ./start.sh
```

The Node server and refresh utilities accept `FUSEKI_QUERY_URL` when using a separately configured compatible Fuseki dataset. The supplied setup/start scripts retain their documented fixed Fuseki ports and database path.

```powershell
$env:FUSEKI_QUERY_URL = 'http://127.0.0.1:3030/parking/query'
```

The page defaults to a **white background with blue accents**, regardless of the operating system theme. Add `?clawpilotTheme=dark` for the optional dark background with blue accents, or `?clawpilotTheme=light` to explicitly select the default. The map's green/amber/red/gray occupancy markers are unchanged.