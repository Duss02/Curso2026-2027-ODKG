from urllib.parse import parse_qs

import httpx
import pytest
from fastapi.testclient import TestClient

from traffic_api.config import Settings
from traffic_api.main import create_app
from traffic_api.queries import accidents_query


def binding(value, kind="literal"):
    return {"type": kind, "value": str(value)}


def result(rows):
    return {"head": {"vars": sorted({key for row in rows for key in row})}, "results": {"bindings": rows}}


def accident_row(street=True):
    # Test fixture taken from the existing RDF example, never used by the app.
    row = {
        "accident": binding("http://group01.opendata.upm.es/resource/accidents/A-194408", "uri"),
        "latitude": binding("40.770107"), "longitude": binding("-73.957397"),
        "severity": binding("2"), "startTime": binding("2016-12-01T08:21:11"),
    }
    if street:
        row["streetName"] = binding("E 74th St")
    return row


@pytest.fixture
def client_factory():
    def factory(handler):
        return TestClient(create_app(
            Settings(_env_file=None), transport=httpx.MockTransport(handler)
        ))
    return factory


def test_health_sends_real_select_protocol(client_factory):
    seen = []

    def handler(request):
        seen.append(request)
        assert request.method == "POST"
        assert request.headers["accept"] == "application/sparql-results+json"
        form = parse_qs(request.content.decode())
        assert form["query"] == ["SELECT (1 AS ?ok) WHERE {}"]
        assert form["infer"] == ["false"]
        assert request.extensions["timeout"]["connect"] == 3.0
        return httpx.Response(200, json=result([{"ok": binding(1)}]))

    with client_factory(handler) as client:
        assert client.get("/api/health").json() == {"status": "ok", "graphdb": "reachable"}
    assert len(seen) == 1


def test_severity_conversion(client_factory):
    expected = [{"severity": s, "count": n} for s, n in [(1, 9), (2, 17900), (3, 3309), (4, 481)]]

    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert "COUNT(DISTINCT ?accident)" in query
        return httpx.Response(200, json=result([
            {key: binding(value) for key, value in row.items()} for row in expected
        ]))

    with client_factory(handler) as client:
        response = client.get("/api/statistics/severity")
        assert response.status_code == 200
        assert response.json() == expected


def test_listing_conversion_and_optional_street(client_factory):
    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert "OPTIONAL { ?accident ao:locatedOn" in query
        assert "ORDER BY STR(?accident)" in query
        assert "LIMIT 2\nOFFSET 7" in query
        missing = accident_row(False)
        missing["accident"] = binding("http://group01.opendata.upm.es/resource/accidents/A-test-no-street", "uri")
        return httpx.Response(200, json=result([accident_row(), missing]))

    with client_factory(handler) as client:
        response = client.get("/api/accidents?limit=2&offset=7")
        assert response.status_code == 200
        page = response.json()
        assert page["limit"] == 2 and page["offset"] == 7
        first, missing = page["items"]
        assert first == {
            "id": "A-194408", "uri": "http://group01.opendata.upm.es/resource/accidents/A-194408",
            "latitude": 40.770107, "longitude": -73.957397, "severity": 2,
            "start_time": "2016-12-01T08:21:11", "street_name": "E 74th St",
        }
        assert missing["street_name"] is None


@pytest.mark.parametrize("params", ["limit=0", "limit=1001", "limit=-1", "limit=x", "offset=-1", "offset=1000001", "offset=0%20UNION"])
def test_invalid_pagination_never_calls_graphdb(client_factory, params):
    def handler(request):
        pytest.fail("Invalid input reached GraphDB")
    with client_factory(handler) as client:
        assert client.get(f"/api/accidents?{params}").status_code == 422


def test_default_pagination_and_empty_page(client_factory):
    def handler(request):
        assert "LIMIT 100\nOFFSET 0" in parse_qs(request.content.decode())["query"][0]
        return httpx.Response(200, json=result([]))
    with client_factory(handler) as client:
        assert client.get("/api/accidents").json() == {"items": [], "limit": 100, "offset": 0}


@pytest.mark.parametrize("path", ["/api/health", "/api/statistics/severity", "/api/accidents"])
@pytest.mark.parametrize("failure,status,code", [
    ("connection", 503, "graphdb_unavailable"),
    ("timeout", 504, "graphdb_timeout"),
    ("http", 502, "graphdb_http_error"),
    ("json", 502, "graphdb_invalid_response"),
    ("shape", 502, "graphdb_invalid_response"),
])
def test_upstream_errors(client_factory, path, failure, status, code):
    def handler(request):
        if failure == "connection":
            raise httpx.ConnectError("refused", request=request)
        if failure == "timeout":
            raise httpx.ReadTimeout("timeout", request=request)
        if failure == "http":
            return httpx.Response(500, text="private upstream diagnostics")
        if failure == "json":
            return httpx.Response(200, text="not JSON")
        return httpx.Response(200, json={"boolean": True})
    with client_factory(handler) as client:
        response = client.get(path)
        assert response.status_code == status
        assert response.json()["detail"]["code"] == code
        assert "private upstream" not in response.text


@pytest.mark.parametrize("rows", [[], [{"ok": binding(0)}]])
def test_health_does_not_accept_invalid_probe(client_factory, rows):
    with client_factory(lambda r: httpx.Response(200, json=result(rows))) as client:
        assert client.get("/api/health").status_code == 502


@pytest.mark.parametrize("field,value", [("latitude", "NaN"), ("latitude", "100"), ("severity", "high"), ("startTime", "yesterday")])
def test_invalid_accident_values(client_factory, field, value):
    row = accident_row()
    row[field] = binding(value)
    with client_factory(lambda r: httpx.Response(200, json=result([row]))) as client:
        assert client.get("/api/accidents").status_code == 502


def test_missing_required_binding(client_factory):
    row = accident_row()
    del row["latitude"]
    with client_factory(lambda r: httpx.Response(200, json=result([row]))) as client:
        assert client.get("/api/accidents").status_code == 502


def test_cors(client_factory):
    with client_factory(lambda r: httpx.Response(200, json=result([]))) as client:
        for origin, allowed in [("http://localhost:5173", True), ("https://other.example", False)]:
            response = client.options("/api/accidents", headers={
                "Origin": origin, "Access-Control-Request-Method": "GET",
            })
            assert (response.status_code == 200) is allowed
            assert (response.headers.get("access-control-allow-origin") == origin) is allowed


def test_environment_override(monkeypatch):
    monkeypatch.setenv("GRAPHDB_ENDPOINT", "http://localhost:7200/repositories/test")
    assert str(Settings(_env_file=None).graphdb_endpoint).endswith("/test")


def test_query_builder_rejects_unsafe_values():
    for limit, offset in [("1", 0), (True, 0), (1001, 0), (1, -1)]:
        with pytest.raises(ValueError):
            accidents_query(limit, offset)
