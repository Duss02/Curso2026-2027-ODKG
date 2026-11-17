"""Fastest and safest routes on the Madrid street network.

fastest: minimum travel time (OSM speeds; bicycles: length)
safest:  travel time + SAFE_ROUTE_PENALTY_SECONDS x segment risk, so a segment with a weighted history of 3
         costs like 3 extra minutes. If the safe route is longer than SAFE_ROUTE_MAX_DETOUR x the
         fastest, the penalty is halved until it is not (up to 6 times); otherwise there is no
         reasonable safer alternative and the fastest route is returned for both.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import networkx as nx
import pandas as pd

from safeway import config



@dataclass
class RiskModel:
    """Street network of one profile with the risk of each segment attached."""
    profile: str
    graph: nx.MultiDiGraph
    risk: dict            # (u, v) with u < v -> weighted risk for this profile
    segments: pd.DataFrame
    city_risk_per_km: float
    hotspot_min_risk: float
    hotspot_high_risk: float

    def segment_risk(self, u, v) -> float:
        return self.risk.get((u, v) if u < v else (v, u), 0.0)


@dataclass
class Route:
    nodes: list
    length_m: float
    minutes: float
    risk: float
    risk_per_km: float
    level: str
    hotspots: pd.DataFrame = field(repr=False)
    coords: list = field(repr=False)          # [(lat, lon), ...] for the map
    segment_risk: list = field(repr=False)    # risk of each step, aligned with coords[1:]


def _base_cost(data: dict, network: str) -> float:
    if network == "bike":
        return data.get("length", 1.0) / (config.PROFILE_SPEED_KMH["Bicycle"] / 3.6)
    return data.get("travel_time") or data.get("length", 1.0) / (30 / 3.6)


def _best_edge(model: RiskModel, u, v, network: str) -> dict:
    edges = model.graph.get_edge_data(u, v)
    return min(edges.values(), key=lambda d: _base_cost(d, network))


def nearest_node(model: RiskModel, lat: float, lon: float):
    import osmnx as ox
    from safeway.risk import project

    x, y = project(pd.Series([lat]), pd.Series([lon]))
    return ox.distance.nearest_nodes(model.graph, x[0], y[0])


def level(model: RiskModel, risk_per_km: float) -> str:
    ratio = risk_per_km / max(model.city_risk_per_km, 1e-9)
    return "Low" if ratio < config.LEVEL_LOW else "Medium" if ratio < config.LEVEL_HIGH else "High"


def _summarise(model: RiskModel, nodes: list) -> Route:
    network = config.PROFILE_NETWORK[model.profile]
    length = 0.0
    risk = 0.0
    seen = set()
    step_risk = []
    for u, v in zip(nodes[:-1], nodes[1:]):
        d = _best_edge(model, u, v, network)
        length += d.get("length", 0.0)
        key = (u, v) if u < v else (v, u)
        r = model.segment_risk(u, v)
        step_risk.append(r)
        if key not in seen:
            risk += r
            seen.add(key)
    km = max(length / 1000, 1e-9)
    keys = pd.DataFrame(list(seen), columns=["u", "v"]) if seen else pd.DataFrame(columns=["u", "v"])
    on_route = model.segments.merge(keys, on=["u", "v"])
    hot = on_route[(on_route["accidents"] >= config.HOTSPOT_MIN_ACCIDENTS)
                   & (on_route[f"risk_{model.profile}"] >= model.hotspot_min_risk)].copy()
    hot["level"] = (hot[f"risk_{model.profile}"] >= model.hotspot_high_risk).map({True: "High", False: "Medium"})
    hot = hot.sort_values(f"risk_{model.profile}", ascending=False)
    coords = [(model.graph.nodes[n]["lat"], model.graph.nodes[n]["lon"]) for n in nodes]
    minutes = length / 1000 / config.PROFILE_SPEED_KMH[model.profile] * 60
    return Route(nodes, length, minutes, risk, risk / km, level(model, risk / km), hot, coords, step_risk)


MOTORWAYS = {"motorway", "motorway_link", "trunk", "trunk_link"}


def _allowed(data: dict, closed: frozenset, avoid_motorways: bool) -> bool:
    from safeway.streets import edge_name

    if closed and any(part in closed for part in edge_name(data).split(" / ")):
        return False
    if avoid_motorways:
        highway = data.get("highway")
        kinds = set(highway) if isinstance(highway, list) else {highway}
        if kinds & MOTORWAYS:
            return False
    return True


def route(model: RiskModel, origin: tuple[float, float], destination: tuple[float, float],
          penalty: float | None = None, max_detour: float | None = None,
          closed_streets: set[str] | frozenset = frozenset(), avoid_motorways: bool = False) -> dict:
    """Fastest and safest route between two (lat, lon) points.

    penalty: seconds added per unit of segment risk (default from config); max_detour: the safe
    route may be at most this times longer than the fastest; closed_streets: OSM street names
    that cannot be used; avoid_motorways: skip motorways and trunk roads.
    """
    network = config.PROFILE_NETWORK[model.profile]
    penalty = config.SAFE_ROUTE_PENALTY_SECONDS if penalty is None else penalty
    max_detour = config.SAFE_ROUTE_MAX_DETOUR if max_detour is None else max_detour
    closed = frozenset(closed_streets)
    src, dst = nearest_node(model, *origin), nearest_node(model, *destination)
    if src == dst:
        raise ValueError("Start and destination are on the same street corner")

    ends = {src, dst}

    def base(u, v, edges):
        # closures never apply to the street you start or end on: you could not leave or arrive
        if u in ends or v in ends:
            costs = [_base_cost(d, network) for d in edges.values()]
        else:
            costs = [_base_cost(d, network) for d in edges.values() if _allowed(d, closed, avoid_motorways)]
        return min(costs) if costs else None          # None hides the edge from Dijkstra

    def fast_weight(u, v, edges):
        return base(u, v, edges)

    try:
        fastest_nodes = nx.shortest_path(model.graph, src, dst, weight=fast_weight)
    except nx.NetworkXNoPath:
        raise ValueError("No route avoids the closed streets / motorways you chose") from None
    fastest = _summarise(model, fastest_nodes)

    safest = fastest
    for _ in range(7):
        def safe_weight(u, v, edges, p=penalty):
            cost = base(u, v, edges)
            return None if cost is None else cost + p * model.segment_risk(u, v)

        candidate = _summarise(model, nx.shortest_path(model.graph, src, dst, weight=safe_weight))
        if candidate.length_m <= max_detour * fastest.length_m:
            safest = candidate
            break
        penalty /= 2
    has_alternative = safest.nodes != fastest.nodes and safest.risk < fastest.risk
    return {"fastest": fastest, "safest": safest if has_alternative else fastest,
            "has_alternative": has_alternative}
