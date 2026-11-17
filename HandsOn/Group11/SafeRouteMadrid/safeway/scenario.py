"""What-if scenarios: the same trip under hypothetical conditions.

A scenario filters the accident history to the conditions asked about (weather, time of day,
weekday/weekend), rebuilds the risk of every street segment from those accidents only, and
routes with the scenario's choices (vehicle, closed streets, motorways, detour tolerance, risk
sensitivity). Each route's level compares it with the Madrid average *under the same conditions*,
so "night" is not automatically "safer" just because fewer people drive at night.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field, replace
from functools import lru_cache

import pandas as pd

from safeway import config, risk, routing
from safeway.routing import RiskModel

WEATHER = {
    "Any weather": None,
    "Clear": {"Despejado"},
    "Cloudy": {"Nublado"},
    "Rain": {"Lluvia débil", "LLuvia intensa"},
    "Heavy rain": {"LLuvia intensa"},
    "Snow or hail": {"Nevando", "Granizando"},
}
TIME_BANDS = {
    "Any time": None,
    "Morning (6–12 h)": (6, 12),
    "Afternoon (12–18 h)": (12, 18),
    "Evening (18–24 h)": (18, 24),
    "Night (0–6 h)": (0, 6),
}
DAYS = {"Any day": None, "Weekday": {0, 1, 2, 3, 4}, "Weekend": {5, 6}}


@dataclass(frozen=True)
class Scenario:
    vehicle: str = "Car"
    weather: str = "Any weather"
    time_band: str = "Any time"
    day: str = "Any day"
    closed_streets: tuple[str, ...] = ()
    avoid_motorways: bool = False
    max_detour_pct: int = 60
    risk_sensitivity: float = 1.0         # x SAFE_ROUTE_PENALTY_SECONDS
    title: str = field(default="", compare=False)

    def conditions(self) -> str:
        parts = [p for p in (self.weather, self.time_band, self.day) if not p.startswith("Any")]
        return ", ".join(parts) or "all conditions"


@lru_cache(maxsize=2)
def _snapped(network: str) -> pd.DataFrame:
    df = pd.read_parquet(config.PROCESSED_DIR / f"snapped_{network}.parquet")
    dt = pd.to_datetime(df["date"], errors="coerce")
    df["weekday"] = dt.dt.weekday
    df["hour"] = pd.to_numeric(df["time"].str.slice(0, 2), errors="coerce")
    return df


@lru_cache(maxsize=1)
def _meta() -> dict:
    return json.loads((config.PROCESSED_DIR / "meta.json").read_text(encoding="utf-8"))


def filter_accidents(df: pd.DataFrame, s: Scenario) -> pd.DataFrame:
    if WEATHER[s.weather]:
        df = df[df["weather"].isin(WEATHER[s.weather])]
    if TIME_BANDS[s.time_band]:
        lo, hi = TIME_BANDS[s.time_band]
        df = df[(df["hour"] >= lo) & (df["hour"] < hi)]
    if DAYS[s.day]:
        df = df[df["weekday"].isin(DAYS[s.day])]
    return df


def model_for(base: RiskModel, s: Scenario) -> RiskModel:
    """The base model with segment risk rebuilt from the accidents matching the scenario."""
    network = config.PROFILE_NETWORK[s.vehicle]
    if s.conditions() == "all conditions":
        return base
    acc = filter_accidents(_snapped(network), s)
    w = f"w_{s.vehicle}"
    grouped = acc.groupby(["u", "v"]).agg(accidents=("id", "count"), severe=("severe", "sum"),
                                          risk=(w, "sum"), same=(f"same_{s.vehicle}", "sum"))
    seg = base.segments[["u", "v", "street", "length_m", "lat", "lon", "main_type"]].merge(
        grouped.reset_index(), on=["u", "v"])
    seg = seg.rename(columns={"risk": f"risk_{s.vehicle}", "same": f"same_vehicle_{s.vehicle}"})
    total_km = _meta()["networks"][network]["total_km"]
    candidates = seg.loc[seg["accidents"] >= config.HOTSPOT_MIN_ACCIDENTS, f"risk_{s.vehicle}"]
    # few accidents under rare conditions: fall back to any segment with accidents
    if len(candidates) < 20:
        candidates = seg[f"risk_{s.vehicle}"]
    return RiskModel(
        s.vehicle, base.graph, dict(zip(zip(seg["u"], seg["v"]), seg[f"risk_{s.vehicle}"])), seg,
        city_risk_per_km=float(seg[f"risk_{s.vehicle}"].sum() / max(total_km, 1e-9)),
        hotspot_min_risk=float(candidates.quantile(0.75)) if len(candidates) else float("inf"),
        hotspot_high_risk=float(candidates.quantile(0.95)) if len(candidates) else float("inf"))


def run(base: RiskModel, s: Scenario, origin, destination) -> dict:
    model = model_for(base, s)
    result = routing.route(model, origin, destination,
                           penalty=config.SAFE_ROUTE_PENALTY_SECONDS * s.risk_sensitivity,
                           max_detour=1 + s.max_detour_pct / 100,
                           closed_streets=set(s.closed_streets), avoid_motorways=s.avoid_motorways)
    result["model"] = model
    result["accidents_used"] = int(filter_accidents(_snapped(config.PROFILE_NETWORK[s.vehicle]), s).shape[0]) \
        if model is not base else _meta()["networks"][config.PROFILE_NETWORK[s.vehicle]]["snapped"]
    return result


def best_time(base: RiskModel, s: Scenario, origin, destination) -> pd.DataFrame:
    """The scenario at every time of day: which band has the least accident history on the route."""
    rows = []
    for band in [b for b in TIME_BANDS if TIME_BANDS[b]]:
        r = run(base, replace(s, time_band=band), origin, destination)
        city = max(r["model"].city_risk_per_km, 1e-9)
        usual, safer = r["fastest"], r["safest"]
        rows.append({"Time of day": band,
                     "Usual route": usual.level, "Usual vs Madrid": usual.risk_per_km / city,
                     "Safer route": safer.level, "Safer vs Madrid": safer.risk_per_km / city,
                     "Risk locations (usual)": len(usual.hotspots),
                     "Accidents in data": r["accidents_used"]})
    return pd.DataFrame(rows).sort_values("Usual vs Madrid").reset_index(drop=True)
