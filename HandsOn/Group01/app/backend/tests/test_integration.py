"""Opt-in real queries; never skipped on connection failure once enabled."""

import os
from collections import Counter
from decimal import Decimal, ROUND_FLOOR

import pytest
from fastapi.testclient import TestClient

from traffic_api.main import create_app

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(os.getenv("RUN_GRAPHDB_INTEGRATION") != "1", reason="Set RUN_GRAPHDB_INTEGRATION=1 to query GraphDB"),
]


@pytest.fixture(scope="module")
def all_rows():
    rows = []
    with TestClient(create_app()) as client:
        for offset in range(0, 22000, 1000):
            page = client.get(f"/api/accidents?limit=1000&offset={offset}")
            assert page.status_code == 200, page.text
            rows.extend(page.json()["items"])
    return rows


def test_live_graphdb_acceptance(all_rows):
    with TestClient(create_app()) as client:
        health = client.get("/api/health")
        assert health.status_code == 200, health.text
        response = client.get("/api/statistics/severity")
        assert response.status_code == 200, response.text
        assert {r["severity"]: r["count"] for r in response.json()} == {1: 9, 2: 17900, 3: 3309, 4: 481}

        first = client.get("/api/accidents?limit=5&offset=0")
        assert first.status_code == 200, first.text
        assert first.json() == client.get("/api/accidents?limit=5&offset=0").json()
        second = client.get("/api/accidents?limit=5&offset=5")
        assert second.status_code == 200, second.text
        a, b = first.json()["items"], second.json()["items"]
        assert len(a) == len(b) == 5
        assert not ({r["uri"] for r in a} & {r["uri"] for r in b})
        # Check all pages against this specific academic dataset, including the
        # 96 rows with no associated street; no direct RDF/CSV loading involved.
        rows = all_rows
        assert len(rows) == len({r["uri"] for r in rows}) == 21699
        assert sum(r["street_name"] is None for r in rows) == 96
        assert sum(r["street_name"] is not None for r in rows) == 21603
        assert all(40.69 < r["latitude"] < 40.88 and -74.03 < r["longitude"] < -73.90 for r in rows)
        assert_hotspots_match_rows(client, [], rows)


def assert_hotspots_match_rows(client, params, rows):
    response = client.get('/api/hotspots', params=params)
    assert response.status_code == 200, response.text
    data = response.json()
    step = Decimal(str(data['cell_size_degrees']))
    def bin_for(value):
        return int((Decimal(str(value)) / step).to_integral_value(rounding=ROUND_FLOOR))
    expected = Counter((bin_for(row['latitude']), bin_for(row['longitude'])) for row in rows)
    actual = {(bin_for(cell['south']), bin_for(cell['west'])): cell['count'] for cell in data['cells']}
    assert actual == expected
    assert data['total'] == sum(cell['count'] for cell in data['cells']) == len(rows)
    assert data['max_count'] == max(expected.values(), default=0)


@pytest.mark.parametrize("levels,start,end,street", [
    ([1], None, None, None),
    ([], '2023-03-31', '2023-03-31', None),
    ([], None, None, 'bRoAd'),
    ([2, 3], '2021-01-01', '2021-12-31', None),
    ([2, 3], None, None, 'fdr'),
    ([], '2021-01-01', '2021-12-31', 'broad'),
    ([2, 3], '2021-01-01', '2021-12-31', 'broad'),
    ([], None, None, 'no-such-street-xyz'),
    ([], None, None, '" } UNION { ?s ?p ?o } #'),
    ([], None, None, r'\u0022 } UNION { ?s ?p ?o } #'),
])
def test_live_filters_match_independent_python_selection(all_rows, levels, start, end, street):
    expected = [row for row in all_rows
                if (not levels or row['severity'] in levels)
                and (not start or row['start_time'][:10] >= start)
                and (not end or row['start_time'][:10] <= end)
                and (not street or street.lower() in (row['street_name'] or '').lower())]
    params = [('severity', value) for value in levels]
    params += [(key, value) for key, value in [('start_date', start), ('end_date', end), ('street', street)] if value]
    with TestClient(create_app()) as client:
        stats = client.get('/api/statistics/severity', params=params)
        assert stats.status_code == 200, stats.text
        assert sum(row['count'] for row in stats.json()) == len(expected)
        assert_hotspots_match_rows(client, params, expected)
        page = client.get('/api/accidents', params=params + [('limit', 20), ('offset', 0)])
        assert page.status_code == 200, page.text
        assert [row['uri'] for row in page.json()['items']] == sorted(row['uri'] for row in expected)[:20]
        if len(expected) > 20:
            next_page = client.get('/api/accidents', params=params + [('limit', 20), ('offset', 20)])
            assert next_page.status_code == 200, next_page.text
            assert [row['uri'] for row in next_page.json()['items']] == sorted(row['uri'] for row in expected)[20:40]


def test_live_detail_metadata_and_optional_links(all_rows):
    with TestClient(create_app()) as client:
        metadata_response = client.get('/api/dataset')
        assert metadata_response.status_code == 200, metadata_response.text
        metadata = metadata_response.json()
        assert metadata['start_time'] == min(row['start_time'] for row in all_rows)
        assert metadata['end_time'] == max(row['start_time'] for row in all_rows)
        assert metadata['south'] == min(row['latitude'] for row in all_rows)
        assert metadata['east'] == max(row['longitude'] for row in all_rows)
        for row in [next(r for r in all_rows if r['street_name'] == 'Broadway'), next(r for r in all_rows if r['street_name'] is None)]:
            response = client.get('/api/accidents/' + row['id'])
            assert response.status_code == 200, response.text
            detail = response.json()
            assert all(detail[key] == row[key] for key in ('id', 'uri', 'severity', 'latitude', 'longitude', 'start_time', 'street_name'))
            assert detail['end_time'] is not None and detail['description']
            if row['street_name'] is None:
                assert detail['street_uri'] is None and detail['street_wikidata_uri'] is None
            else:
                assert detail['street_uri'].startswith('http://group01.opendata.upm.es/resource/streets/')
                assert detail['street_wikidata_uri'].startswith('http://www.wikidata.org/entity/Q')
        assert client.get('/api/accidents/A-does-not-exist').status_code == 404


def test_live_street_reference_counts():
    import httpx
    from traffic_api.config import Settings
    from traffic_api.queries import PREFIXES
    query = PREFIXES + '''
    SELECT ?streets ?linked WHERE {
      { SELECT (COUNT(DISTINCT ?s) AS ?streets) WHERE { ?s a ao:Street } }
      { SELECT (COUNT(DISTINCT ?s) AS ?linked) WHERE { ?s a ao:Street; owl:sameAs ?w } }
    }
    '''
    with httpx.Client(trust_env=False, timeout=15) as http:
        response = http.post(str(Settings().graphdb_endpoint), data={'query': query, 'infer': 'false'}, headers={'Accept': 'application/sparql-results+json'})
        response.raise_for_status()
        row = response.json()['results']['bindings'][0]
        assert int(row['streets']['value']) == 538
        assert int(row['linked']['value']) == 60
