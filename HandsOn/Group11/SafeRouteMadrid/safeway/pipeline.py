"""End-to-end build (used by scripts/build.py and by the app's Data page) and the app's loader."""
from __future__ import annotations

import json
import pickle

import pandas as pd

from safeway import config, geocode, queries, rdf, risk, streets
from safeway.routing import RiskModel


def _graph(network: str, log=print):
    """Street graph with travel times, from the pickle cache, the GraphML cache or OSM."""
    pkl = config.STREETS_DIR / f"madrid_{network}.pkl"
    if pkl.exists():
        return pickle.loads(pkl.read_bytes())
    if streets.graph_path(network).exists():
        g = streets.load(network)
    else:
        log(f"Downloading the Madrid {network} network from OpenStreetMap (one time, a few minutes)")
        g = streets.download(network)
    if network == "drive":
        import osmnx as ox
        g = ox.add_edge_travel_times(ox.add_edge_speeds(g))
    pkl.write_bytes(pickle.dumps(g, protocol=pickle.HIGHEST_PROTOCOL))
    return g


def networks() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for profile, network in config.PROFILE_NETWORK.items():
        out.setdefault(network, []).append(profile)
    return out


def build_risk(store, log=print) -> None:
    config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    log("Querying accidents from the triplestore (SPARQL)")
    acc = risk.accident_weights(queries.accidents(store))
    acc.drop(columns=["vehicleTypes", "severityCodes"]).to_parquet(config.PROCESSED_DIR / "accidents.parquet")
    meta = {"accidents": len(acc), "profiles": {}, "networks": {}}
    for network, profiles in networks().items():
        g = _graph(network, log)
        log(f"Snapping {len(acc):,} accidents to the {network} network")
        snapped = risk.snap(g, acc)
        seg = risk.segment_table(g, snapped, profiles)
        seg.to_parquet(config.PROCESSED_DIR / f"segments_{network}.parquet")
        # one row per accident with its segment: the What-if page filters these by conditions
        keep = ["id", "u", "v", "date", "time", "weather", "accidentType", "severity_weight", "severe"]
        keep += [c for p in profiles for c in (f"w_{p}", f"same_{p}")]
        snapped[keep].to_parquet(config.PROCESSED_DIR / f"snapped_{network}.parquet")
        total_km = sum(d.get("length", 0.0) for _, _, d in g.edges(data=True)) / 1000 / 2
        meta["networks"][network] = {"snapped": len(snapped), "segments_with_accidents": len(seg),
                                     "total_km": total_km}
        meta["profiles"].update(risk.thresholds(g, seg, profiles))
        log(f"  {len(snapped):,} accidents on {len(seg):,} segments")
    (config.PROCESSED_DIR / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    if not geocode.is_built():
        log("Building the address and place index for the search box")
        geocode.build_index(log)


def build(force: bool = False, skip_ingest: bool = False, store=None, log=print) -> dict:
    store = store or rdf.open_store()
    summary = {} if skip_ingest else rdf.ingest(store, force=force, log=log)
    build_risk(store, log)
    return summary


def is_built() -> bool:
    return (config.PROCESSED_DIR / "meta.json").exists()


def load_model(profile: str) -> RiskModel:
    network = config.PROFILE_NETWORK[profile]
    meta = json.loads((config.PROCESSED_DIR / "meta.json").read_text(encoding="utf-8"))["profiles"][profile]
    seg = pd.read_parquet(config.PROCESSED_DIR / f"segments_{network}.parquet")
    risk_by_segment = dict(zip(zip(seg["u"], seg["v"]), seg[f"risk_{profile}"]))
    return RiskModel(profile, _graph(network), risk_by_segment, seg, meta["city_risk_per_km"],
                     meta["hotspot_min_risk"], meta["hotspot_high_risk"])
