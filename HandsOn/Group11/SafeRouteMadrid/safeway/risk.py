"""Historical accident density per street segment and vehicle profile.

Each accident (from SPARQL) is snapped to its nearest street segment (<= MAX_SNAP_METERS). A
segment is an undirected pair of OSM nodes, so both directions of a street share its history.

Weight of one accident for a profile = severity weight x vehicle weight
  severity weight: worst injury in the accident (SEVERITY_WEIGHT, fatal = 10)
  vehicle weight:  SAME_VEHICLE_WEIGHT if a vehicle of that profile was involved, else
                   ALL_VEHICLES_WEIGHT (the street is still risky, less so for this vehicle)

This is historical density, not a prediction: busy streets accumulate more accidents because they
carry more traffic, and the data has no traffic volumes to normalise by.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from pyproj import Transformer

from safeway import config, streets


def accident_weights(acc: pd.DataFrame) -> pd.DataFrame:
    acc = acc.copy()
    acc["severity_weight"] = acc["severityCodes"].map(
        lambda codes: max((config.SEVERITY_WEIGHT.get(c, config.DEFAULT_SEVERITY_WEIGHT) for c in codes),
                          default=config.DEFAULT_SEVERITY_WEIGHT))
    acc["severe"] = acc["severityCodes"].map(lambda codes: any(c in ("3", "4") for c in codes))
    for profile, categories in config.VEHICLE_PROFILES.items():
        same = acc["vehicleTypes"].map(lambda types, cats=set(categories): bool(cats.intersection(types)))
        acc[f"same_{profile}"] = same
        acc[f"w_{profile}"] = acc["severity_weight"] * np.where(
            same, config.SAME_VEHICLE_WEIGHT, config.ALL_VEHICLES_WEIGHT)
    return acc


def project(lat: pd.Series, lon: pd.Series) -> tuple[np.ndarray, np.ndarray]:
    t = Transformer.from_crs("EPSG:4326", f"EPSG:{config.UTM_EPSG}", always_xy=True)
    return t.transform(lon.to_numpy(dtype=float), lat.to_numpy(dtype=float))


def snap(graph, acc: pd.DataFrame) -> pd.DataFrame:
    """Attach each accident to its nearest segment; drops those too far from any street."""
    import osmnx as ox

    x, y = project(acc["lat"], acc["lon"])
    edges, dist = ox.distance.nearest_edges(graph, x, y, return_dist=True)
    acc = acc.copy()
    acc["u"] = [min(e[0], e[1]) for e in edges]
    acc["v"] = [max(e[0], e[1]) for e in edges]
    acc["snap_m"] = dist
    return acc[acc["snap_m"] <= config.MAX_SNAP_METERS]


def segment_table(graph, snapped: pd.DataFrame, profiles: list[str]) -> pd.DataFrame:
    """One row per segment with accidents: counts, risk per profile, street name, midpoint."""
    agg = {"id": "count", "severe": "sum"}
    for p in profiles:
        agg[f"w_{p}"] = "sum"
        agg[f"same_{p}"] = "sum"
    seg = snapped.groupby(["u", "v"]).agg(agg).rename(columns={"id": "accidents"})
    seg.columns = [c.replace("w_", "risk_").replace("same_", "same_vehicle_") for c in seg.columns]
    top = (snapped.dropna(subset=["accidentType"]).groupby(["u", "v"])["accidentType"]
           .agg(lambda s: s.value_counts().index[0]))
    seg["main_type"] = top
    seg = seg.reset_index()
    names, lengths, lats, lons = [], [], [], []
    for u, v in zip(seg["u"], seg["v"]):
        data = graph.get_edge_data(u, v) or graph.get_edge_data(v, u)
        first = data[min(data)]
        names.append(streets.edge_name(first))
        lengths.append(float(first.get("length", 0.0)))
        nu, nv = graph.nodes[u], graph.nodes[v]
        lats.append((nu["lat"] + nv["lat"]) / 2)
        lons.append((nu["lon"] + nv["lon"]) / 2)
    seg["street"], seg["length_m"], seg["lat"], seg["lon"] = names, lengths, lats, lons
    return seg


def thresholds(graph, seg: pd.DataFrame, profiles: list[str]) -> dict:
    """Per profile: citywide risk per km (for route levels) and the hotspot cut-offs."""
    total_km = sum(d.get("length", 0.0) for _, _, d in graph.edges(data=True)) / 1000 / 2
    out = {}
    for p in profiles:
        candidates = seg.loc[seg["accidents"] >= config.HOTSPOT_MIN_ACCIDENTS, f"risk_{p}"]
        out[p] = {
            "city_risk_per_km": float(seg[f"risk_{p}"].sum() / max(total_km, 1e-9)),
            "hotspot_min_risk": float(candidates.quantile(0.75)) if len(candidates) else float("inf"),
            "hotspot_high_risk": float(candidates.quantile(0.95)) if len(candidates) else float("inf"),
        }
    return out
