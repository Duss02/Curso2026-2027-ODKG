"""Risk weights and routing on a tiny synthetic network.

    A --- B --- D      A-B-D: 1,000 m, B-D has a heavy accident history
     \\         /
      C ------        A-C-D: 1,200 m, no accidents
"""
import networkx as nx
import pandas as pd
import pytest
from pyproj import Transformer

from safeway import config, risk, routing


def test_accident_weights():
    acc = pd.DataFrame({"id": ["a", "b", "c"],
                        "vehicleTypes": [["Turismo"], ["Bicicleta"], []],
                        "severityCodes": [["4", "14"], ["14"], []]})
    w = risk.accident_weights(acc)
    assert w.loc[0, "severity_weight"] == config.SEVERITY_WEIGHT["4"]       # worst injury counts
    assert w.loc[0, "w_Car"] == pytest.approx(10 * config.SAME_VEHICLE_WEIGHT)
    assert w.loc[0, "w_Bicycle"] == pytest.approx(10 * config.ALL_VEHICLES_WEIGHT)
    assert w.loc[1, "same_Bicycle"] and not w.loc[1, "same_Car"]
    assert w.loc[2, "severity_weight"] == config.DEFAULT_SEVERITY_WEIGHT
    assert bool(w.loc[0, "severe"]) and not bool(w.loc[1, "severe"])


TO_WGS84 = Transformer.from_crs(f"EPSG:{config.UTM_EPSG}", "EPSG:4326", always_xy=True)
POS = {1: (440000, 4474000), 2: (440500, 4474000), 3: (440500, 4473700), 4: (441000, 4474000)}


def _latlon(node):
    lon, lat = TO_WGS84.transform(*POS[node])
    return lat, lon


def _model(risk_bd: float, c_length: float = 600) -> routing.RiskModel:
    g = nx.MultiDiGraph(crs=f"EPSG:{config.UTM_EPSG}")
    for n, (x, y) in POS.items():
        lon, lat = TO_WGS84.transform(x, y)
        g.add_node(n, x=x, y=y, lat=lat, lon=lon)
    for u, v, length in [(1, 2, 500), (2, 4, 500), (1, 3, c_length), (3, 4, 600)]:
        for a, b in ((u, v), (v, u)):
            g.add_edge(a, b, length=length, travel_time=length / 10, name=f"street {u}{v}")
    seg = pd.DataFrame({"u": [2], "v": [4], "accidents": [20], "severe": [2], "risk_Car": [risk_bd],
                        "same_vehicle_Car": [15], "main_type": ["Alcance"], "street": ["street 24"],
                        "length_m": [500.0], "lat": [40.403], "lon": [-3.697]})
    return routing.RiskModel("Car", g, {(2, 4): risk_bd}, seg, city_risk_per_km=5.0,
                             hotspot_min_risk=10.0, hotspot_high_risk=30.0)


def test_safe_route_avoids_the_risky_segment():
    model = _model(risk_bd=40.0)
    r = routing.route(model, _latlon(1), _latlon(4))
    assert r["fastest"].nodes == [1, 2, 4]
    assert r["has_alternative"] and r["safest"].nodes == [1, 3, 4]
    assert r["fastest"].risk == 40.0 and r["safest"].risk == 0.0
    assert list(r["fastest"].hotspots["level"]) == ["High"]
    assert r["safest"].hotspots.empty


def test_no_alternative_when_detour_is_too_long():
    model = _model(risk_bd=40.0, c_length=5000)            # A-C-D = 5.6 km vs 1 km
    r = routing.route(model, _latlon(1), _latlon(4))
    assert not r["has_alternative"]
    assert r["safest"].nodes == r["fastest"].nodes


def test_level_relative_to_city_average():
    model = _model(risk_bd=40.0)
    assert routing.level(model, 5.0) == "Low"               # 1x the Madrid average
    assert routing.level(model, 10.0) == "Medium"           # 2x
    assert routing.level(model, 20.0) == "High"             # 4x
