"""What-if scenarios, closed streets and personal settings."""
import networkx as nx
import pandas as pd
from pyproj import Transformer

from safeway import config, routing, scenario as sc, settings

TO_WGS84 = Transformer.from_crs(f"EPSG:{config.UTM_EPSG}", "EPSG:4326", always_xy=True)
# 1-2-3-4 is the short way (Main street in the middle); 1-5-6-4 the long way (a motorway in the middle)
POS = {1: (440000, 4474000), 2: (440300, 4474000), 3: (440600, 4474000), 4: (440900, 4474000),
       5: (440300, 4473600), 6: (440600, 4473600)}
EDGES = [(1, 2, 300, "First street", "residential"), (2, 3, 300, "Main street", "primary"),
         (3, 4, 300, "Last street", "residential"), (1, 5, 500, "Side road", "residential"),
         (5, 6, 300, "M-30", "motorway"), (6, 4, 500, "Other road", "residential"),
         (2, 5, 400, "Link", "residential"), (3, 6, 400, "Link 2", "residential")]


def _latlon(node):
    lon, lat = TO_WGS84.transform(*POS[node])
    return lat, lon


def _model():
    g = nx.MultiDiGraph(crs=f"EPSG:{config.UTM_EPSG}")
    for n, (x, y) in POS.items():
        lat, lon = _latlon(n)
        g.add_node(n, x=x, y=y, lat=lat, lon=lon)
    for u, v, length, name, highway in EDGES:
        for a, b in ((u, v), (v, u)):
            g.add_edge(a, b, length=length, travel_time=length / 10, name=name, highway=highway)
    seg = pd.DataFrame(columns=["u", "v", "accidents", "severe", "risk_Car", "same_vehicle_Car",
                                "main_type", "street", "length_m", "lat", "lon"])
    return routing.RiskModel("Car", g, {}, seg, 1.0, 10.0, 30.0)


def test_closed_street_is_avoided():
    m = _model()
    assert routing.route(m, _latlon(1), _latlon(4))["fastest"].nodes == [1, 2, 3, 4]
    closed = routing.route(m, _latlon(1), _latlon(4), closed_streets={"Main street"}, max_detour=3)
    assert closed["fastest"].nodes in ([1, 2, 5, 6, 4], [1, 2, 5, 6, 3, 4], [1, 5, 6, 3, 4], [1, 5, 6, 4])
    assert (2, 3) not in zip(closed["fastest"].nodes, closed["fastest"].nodes[1:])


def test_motorways_can_be_avoided():
    import pytest

    m = _model()
    detour = routing.route(m, _latlon(1), _latlon(4), closed_streets={"Main street"}, max_detour=3)
    assert (5, 6) in set(zip(detour["fastest"].nodes, detour["fastest"].nodes[1:]))   # needs the M-30
    with pytest.raises(ValueError, match="No route"):                                 # ...so no way around
        routing.route(m, _latlon(1), _latlon(4), closed_streets={"Main street"}, avoid_motorways=True)


def test_closures_never_trap_the_start():
    m = _model()
    r = routing.route(m, _latlon(1), _latlon(4), closed_streets={"First street", "Side road"})
    assert r["fastest"].nodes[0] == 1                       # streets at the start stay usable


def test_filter_accidents_by_conditions():
    df = pd.DataFrame({"weather": ["Despejado", "Lluvia débil", "LLuvia intensa", "Nevando"],
                       "hour": [8, 23, 2, 3], "weekday": [0, 5, 6, 2]})
    assert len(sc.filter_accidents(df, sc.Scenario(weather="Rain"))) == 2
    assert len(sc.filter_accidents(df, sc.Scenario(weather="Rain", time_band="Night (0–6 h)"))) == 1
    assert len(sc.filter_accidents(df, sc.Scenario(day="Weekend"))) == 2
    assert len(sc.filter_accidents(df, sc.Scenario())) == 4
    assert sc.Scenario(weather="Rain", day="Weekend").conditions() == "Rain, Weekend"


def test_settings_roundtrip_and_bad_values(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "PATH", tmp_path / "settings.json")
    assert settings.load() == settings.Settings()           # no file -> defaults
    settings.save(settings.Settings(default_vehicle="Bicycle", risk_sensitivity="High", max_detour_pct=100))
    s = settings.load()
    assert s.default_vehicle == "Bicycle" and s.max_detour == 2.0
    assert s.penalty_seconds == config.SAFE_ROUTE_PENALTY_SECONDS * 2
    (tmp_path / "settings.json").write_text('{"default_vehicle": "Tank", "unknown": 1}', encoding="utf-8")
    assert settings.load().default_vehicle == "Car"
