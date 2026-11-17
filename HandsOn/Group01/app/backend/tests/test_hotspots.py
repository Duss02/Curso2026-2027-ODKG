from urllib.parse import parse_qs

import httpx
import pytest

from traffic_api import queries
from test_api import binding, result
from test_phase3 import client_for


def test_hotspots_aggregate_all_matches_with_the_shared_filters():
    def handler(request):
        query = parse_qs(request.content.decode())['query'][0]
        assert 'COUNT(DISTINCT ?accident)' in query
        assert 'FLOOR(?longitude / 0.005)' in query
        assert '?severity IN (1, 3)' in query and 'LCASE("broad")' in query
        assert '"2021-01-01T00:00:00"' in query and '"2022-01-01T00:00:00"' in query
        assert 'ao:description' not in query
        assert 'LIMIT 2001' in query
        return httpx.Response(200, json=result([
            {'latBin': binding('8150'), 'lngBin': binding('-14791'), 'count': binding('9')},
            {'latBin': binding('8151'), 'lngBin': binding('-14791'), 'count': binding('2')},
        ]))
    with client_for(handler) as client:
        response = client.get('/api/hotspots', params=[('severity', 1), ('severity', 3), ('street', 'broad'), ('start_date', '2021-01-01'), ('end_date', '2021-12-31')])
        assert response.status_code == 200, response.text
        data = response.json()
        assert data['total'] == 11 and data['max_count'] == 9
        assert data['cell_size_degrees'] == 0.005
        assert data['cells'][0] == {'south': 40.75, 'north': 40.755, 'west': -73.955, 'east': -73.95, 'count': 9}


def test_empty_hotspots_are_not_fabricated():
    with client_for(lambda r: httpx.Response(200, json=result([]))) as client:
        assert client.get('/api/hotspots').json() == {'cell_size_degrees': 0.005, 'cells': [], 'total': 0, 'max_count': 0}


def test_oversized_grid_fails_without_returning_partial_data():
    rows = [{'latBin': binding('8150'), 'lngBin': binding('-14791'), 'count': binding('1')}] * (queries.MAX_HOTSPOT_CELLS + 1)
    with client_for(lambda r: httpx.Response(200, json=result(rows))) as client:
        response = client.get('/api/hotspots')
        assert response.status_code == 422
        assert response.json()['detail']['code'] == 'hotspot_limit_exceeded'
        assert 'cells' not in response.json()


@pytest.mark.parametrize('row', [
    {'latBin': binding('18100'), 'lngBin': binding('0'), 'count': binding('1')},
    {'latBin': binding('0'), 'lngBin': binding('40000'), 'count': binding('1')},
    {'latBin': binding('0'), 'lngBin': binding('0'), 'count': binding('0')},
    {'latBin': binding('NaN'), 'lngBin': binding('0'), 'count': binding('1')},
    {},
])
def test_invalid_grid_bindings_are_upstream_errors(row):
    with client_for(lambda r: httpx.Response(200, json=result([row]))) as client:
        assert client.get('/api/hotspots').status_code == 502


@pytest.mark.parametrize('params', [{'severity': 5}, {'severity': 0}, {'start_date': '2022-01-02', 'end_date': '2022-01-01'}, {'street': 'x'*121}])
def test_hotspots_validate_filters_before_query(params):
    with client_for(lambda r: pytest.fail('Invalid filters reached GraphDB')) as client:
        assert client.get('/api/hotspots', params=params).status_code == 422


@pytest.mark.parametrize('failure,status', [('connection', 503), ('timeout', 504), ('http', 502)])
def test_hotspot_failures(failure, status):
    def handler(request):
        if failure == 'connection': raise httpx.ConnectError('refused', request=request)
        if failure == 'timeout': raise httpx.ReadTimeout('timeout', request=request)
        return httpx.Response(500)
    with client_for(handler) as client:
        assert client.get('/api/hotspots').status_code == status
