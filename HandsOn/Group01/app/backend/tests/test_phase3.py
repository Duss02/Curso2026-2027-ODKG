"""Exercise actual route validation, query generation and HTTP transformation."""
from datetime import date
from urllib.parse import parse_qs

import httpx
import pytest
from fastapi.testclient import TestClient

from traffic_api.config import Settings
from traffic_api.main import create_app
from traffic_api.models import AccidentFilters
from traffic_api.queries import accidents_query, detail_query, literal, severity_query
from test_api import accident_row, binding, result


def client_for(handler):
    return TestClient(create_app(Settings(_env_file=None), transport=httpx.MockTransport(handler)))


@pytest.mark.parametrize("path", ["/api/accidents", "/api/statistics/severity"])
@pytest.mark.parametrize("params,fragments", [
    ({"severity": [1, 3]}, ["?severity IN (1, 3)"]),
    ({"start_date": "2023-03-30", "end_date": "2023-03-31"}, ['>= "2023-03-30T00:00:00"', '< "2023-04-01T00:00:00"']),
    ({"street": "bRoAd"}, ['CONTAINS(LCASE(STR(?searchName)), LCASE("bRoAd"))']),
    ({"severity": [2, 4], "street": "FDR", "start_date": "2021-01-01", "end_date": "2021-12-31"},
     ["?severity IN (2, 4)", 'LCASE("FDR")', '>= "2021-01-01T00:00:00"', '< "2022-01-01T00:00:00"']),
])
def test_filter_conditions_reach_graphdb(path, params, fragments):
    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert all(part in query for part in fragments)
        return httpx.Response(200, json=result([]))
    with client_for(handler) as client:
        response = client.get(path, params=params)
        assert response.status_code == 200, response.text


@pytest.mark.parametrize("params", [
    {"severity": 0}, {"severity": 5}, {"severity": "oops"},
    {"severity": [1, 2, 3, 4, 1]}, {"start_date": "2021-02-30"},
    {"start_date": "2022-01-02", "end_date": "2022-01-01"},
    {"end_date": "9999-12-31"}, {"street": "x" * 121},
])
@pytest.mark.parametrize("path", ["/api/accidents", "/api/statistics/severity"])
def test_invalid_filters_do_not_query_graphdb(path, params):
    def handler(request):
        pytest.fail("Invalid filters reached GraphDB")
    with client_for(handler) as client:
        assert client.get(path, params=params).status_code == 422


def test_pagination_and_statistics_share_exact_filter_pattern():
    filters = AccidentFilters(severities=(3, 1, 1), street='Broadway', start_date=date(2020, 2, 29), end_date=date(2020, 2, 29))
    listing, counts = accidents_query(10, 20, filters), severity_query(filters)
    for fragment in ['?severity IN (1, 3)', '>= "2020-02-29T00:00:00"', '< "2020-03-01T00:00:00"', 'LCASE("Broadway")']:
        assert fragment in listing and fragment in counts
    assert "OPTIONAL { ?accident ao:locatedOn" in listing
    assert "ORDER BY STR(?accident)" in listing
    assert "LIMIT 10\nOFFSET 20" in listing


@pytest.mark.parametrize("search", ['" } UNION { ?s ?p ?o } #', 'a\\b\n"c', r'\u0022 } UNION { ?s ?p ?o } #', '道路'])
def test_street_is_encoded_as_a_literal(search):
    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert f"LCASE({literal(search)})" in query
        return httpx.Response(200, json=result([]))
    with client_for(handler) as client:
        assert client.get('/api/accidents', params={"street": search}).json()["items"] == []


@pytest.mark.parametrize("linked", [True, False])
def test_detail_fields_and_optional_wikidata(linked):
    row = accident_row()
    row.update({
        "endTime": binding("2016-12-01T08:50:48"), "description": binding("Original RDF description"),
        "trafficSignal": binding("false"), "city": binding("New York City"),
        "state": binding("New York"), "country": binding("United States"),
        "streetUri": binding("http://group01.opendata.upm.es/resource/streets/E-74th-St", "uri"),
    })
    if linked:
        row["streetWikidataUri"] = binding("http://www.wikidata.org/entity/Q11260", "uri")
    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert "VALUES ?accident { <http://group01.opendata.upm.es/resource/accidents/A-194408> }" in query
        assert "owl:sameAs ?wikidata" in query and "schema:containedInPlace" in query
        return httpx.Response(200, json=result([row]))
    with client_for(handler) as client:
        response = client.get('/api/accidents/A-194408')
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["has_traffic_signal"] is False
        assert data["description"] == "Original RDF description"
        assert data["city"] == "New York City"
        assert data["end_time"] == "2016-12-01T08:50:48"
        assert data["street_uri"].endswith('/E-74th-St')
        assert bool(data["street_wikidata_uri"]) is linked


def test_detail_missing_street_and_fields_are_null():
    with client_for(lambda r: httpx.Response(200, json=result([accident_row(False)]))) as client:
        data = client.get('/api/accidents/A-194408').json()
        for key in ('street_name', 'street_uri', 'street_wikidata_uri', 'end_time', 'description', 'has_traffic_signal', 'city', 'state', 'country'):
            assert data[key] is None


def test_detail_not_found():
    with client_for(lambda r: httpx.Response(200, json=result([]))) as client:
        assert client.get('/api/accidents/A-not-found').status_code == 404


@pytest.mark.parametrize("identifier", ['not-an-id', 'A-1> UNION {', 'A-../secret'])
def test_detail_rejects_unsafe_identifiers(identifier):
    with pytest.raises(ValueError):
        detail_query(identifier)
    with client_for(lambda r: pytest.fail('Invalid ID reached GraphDB')) as client:
        response = client.get('/api/accidents/' + identifier)
        assert response.status_code in (422, 404)


def test_metadata_uses_rdf_aggregates():
    def handler(request):
        query = parse_qs(request.content.decode())["query"][0]
        assert 'MIN(?startTime)' in query and 'MAX(?startTime)' in query
        return httpx.Response(200, json=result([{
            'firstTime': binding('2016-03-24T09:56:12'), 'lastTime': binding('2023-03-31T14:08:16'),
            'south': binding('40.692086'), 'north': binding('40.877724'), 'west': binding('-74.021271'), 'east': binding('-73.910516'),
        }]))
    with client_for(handler) as client:
        data = client.get('/api/dataset').json()
        assert data['start_time'] == '2016-03-24T09:56:12'
        assert data['south'] == 40.692086


@pytest.mark.parametrize("path", ['/api/dataset', '/api/accidents/A-194408'])
def test_new_routes_report_connection_failures(path):
    def handler(request):
        raise httpx.ConnectError('connection refused', request=request)
    with client_for(handler) as client:
        response = client.get(path)
        assert response.status_code == 503
        assert response.json()['detail']['code'] == 'graphdb_unavailable'
