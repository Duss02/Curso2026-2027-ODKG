"""Personal settings chosen on the Options page, saved in data/settings.json (not in git)."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, fields

from safeway import config

PATH = config.DATA / "settings.json"
SENSITIVITY = {"Low": 0.5, "Normal": 1.0, "High": 2.0, "Maximum": 4.0}   # x SAFE_ROUTE_PENALTY_SECONDS


@dataclass
class Settings:
    default_vehicle: str = "Car"
    default_start: str = "Moncloa"
    default_destination: str = "Puerta del Sol"
    risk_sensitivity: str = "Normal"            # how hard the safe route avoids accident history
    max_detour_pct: int = round((config.SAFE_ROUTE_MAX_DETOUR - 1) * 100)
    avoid_motorways: bool = False               # motor vehicles only
    map_style: str = "CARTO light"              # or "OpenStreetMap"
    ai_search: bool = True                      # local LLM for the search boxes
    theme: str = "Light"                        # or "Dark" (ui/theme.py)
    email_enabled: bool = False                 # optional email notifications (safeway/notify.py)
    email_address: str = ""
    email_on_route: bool = True                 # route summary after "Calculate route"
    email_on_rebuild: bool = True               # notice when a data rebuild finishes

    @property
    def penalty_seconds(self) -> float:
        return config.SAFE_ROUTE_PENALTY_SECONDS * SENSITIVITY[self.risk_sensitivity]

    @property
    def max_detour(self) -> float:
        return 1 + self.max_detour_pct / 100


def load() -> Settings:
    try:
        data = json.loads(PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return Settings()
    known = {f.name for f in fields(Settings)}
    s = Settings(**{k: v for k, v in data.items() if k in known})
    if s.default_vehicle not in config.VEHICLE_PROFILES:
        s.default_vehicle = "Car"
    if s.risk_sensitivity not in SENSITIVITY:
        s.risk_sensitivity = "Normal"
    if s.theme not in ("Light", "Dark"):
        s.theme = "Light"
    return s


def save(s: Settings) -> None:
    PATH.parent.mkdir(parents=True, exist_ok=True)
    PATH.write_text(json.dumps(asdict(s), indent=2, ensure_ascii=False), encoding="utf-8")
