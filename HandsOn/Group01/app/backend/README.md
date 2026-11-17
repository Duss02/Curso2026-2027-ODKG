# Traffic Accident Explorer backend

The current setup, endpoint contracts, filtering rules, architecture and validation
commands are documented in [the application README](../README.md).

From this directory, start the existing environment with:

```powershell
.\.venv\Scripts\python.exe -m uvicorn traffic_api.main:app --host 127.0.0.1 --port 8000 --reload
```

Configuration is in `.env.example`; the default GraphDB endpoint is
`http://localhost:7200/repositories/group01-accidents`.

The backend uses one lifespan-managed asynchronous HTTPX pool. It sends only
SPARQL SELECT queries, with `infer=false`, to GraphDB. Connection timeout is three
seconds; the other timeout values default to 15 seconds and are configurable.

Errors use `{ "detail": { "code": "...", "message": "..." } }` for upstream
failures: 503 connection failure, 504 timeout, or 502 HTTP/invalid-response errors.
Validation errors use HTTP 422; unknown accident identifiers use HTTP 404.

Tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
$env:RUN_GRAPHDB_INTEGRATION='1'
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
Remove-Item Env:RUN_GRAPHDB_INTEGRATION
```

Live tests are opt-in and fail if the configured GraphDB repository is unavailable
or does not contain the reference Group01 dataset. No CSV or Turtle parsing occurs
in request handlers. There is no write API, repository import, Java configuration
change or secondary database.
