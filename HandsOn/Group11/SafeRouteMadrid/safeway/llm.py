"""Local LLM (Ollama) that interprets what the user typed as a start or destination.

It only extracts structure ({street, number, place}); geocode.py finds the real location in
the OSM index, so the model never invents coordinates. Answers are cached on disk. If Ollama is
not running, `interpret` returns None and the app falls back to simple rules.
"""
from __future__ import annotations

import hashlib
import json

import requests

from safeway import config

URL = "http://localhost:11434"
MODEL = "qwen2.5:3b"
CACHE = config.DATA / "llm_cache.json"

SCHEMA = {
    "type": "object",
    "properties": {
        "kind": {"type": "string", "enum": ["address", "street", "place"]},
        "street": {"type": "string"},
        "number": {"type": "string"},
        "place": {"type": "string"},
    },
    "required": ["kind", "street", "number", "place"],
}

SYSTEM = """You turn what a user typed into a location in Madrid (Spain) as JSON.
- kind "address": a street with a house number. street = the street name as written in Madrid
  (fix spelling and accents, keep the type: "Calle de Alcalá", "Paseo de la Castellana"),
  number = the house number.
- kind "street": a street without number. number = "".
- kind "place": a landmark, station, square, park, stadium, hospital, museum or area. place = its
  usual Spanish name ("Estadio Santiago Bernabéu", "Estación de Atocha", "Puerta del Sol").
  street = "" and number = "".
Unused fields are "". Never answer anything outside Madrid. Answer only the JSON."""

EXAMPLES = [
    ("calle alcala 100", {"kind": "address", "street": "Calle de Alcalá", "number": "100", "place": ""}),
    ("near the bernabeu", {"kind": "place", "street": "", "number": "", "place": "Estadio Santiago Bernabéu"}),
    ("castellana", {"kind": "street", "street": "Paseo de la Castellana", "number": "", "place": ""}),
    ("gran via 28", {"kind": "address", "street": "Gran Vía", "number": "28", "place": ""}),
    ("atocha train station", {"kind": "place", "street": "", "number": "", "place": "Estación de Atocha"}),
]


def _cache() -> dict:
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _save(cache: dict) -> None:
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")


def available() -> bool:
    try:
        tags = requests.get(f"{URL}/api/tags", timeout=2).json()
    except (requests.RequestException, ValueError):
        return False
    return any(m.get("name", "").startswith(MODEL) for m in tags.get("models", []))


def _chat(task: str, system: str, examples: list, schema: dict, text: str, timeout: float) -> dict | None:
    """One structured-output call to Ollama, cached on disk by (model, task, text)."""
    key = hashlib.sha256(f"{MODEL}|{task}|{text.strip().lower()}".encode()).hexdigest()[:16]
    cache = _cache()
    if key in cache:
        return dict(cache[key])
    messages = [{"role": "system", "content": system}]
    for q, a in examples:
        messages += [{"role": "user", "content": q}, {"role": "assistant", "content": json.dumps(a, ensure_ascii=False)}]
    messages.append({"role": "user", "content": text})
    try:
        r = requests.post(f"{URL}/api/chat", timeout=timeout, json={
            "model": MODEL, "messages": messages, "format": schema, "stream": False,
            "options": {"temperature": 0}, "keep_alive": "30m"})
        r.raise_for_status()
        answer = json.loads(r.json()["message"]["content"])
    except (requests.RequestException, ValueError, KeyError):
        return None
    cache[key] = answer
    _save(cache)
    return answer


def interpret(text: str, timeout: float = 30) -> dict | None:
    """Typed start/destination -> {kind, street, number, place}."""
    answer = _chat("location", SYSTEM, EXAMPLES, SCHEMA, text, timeout)
    if answer is None:
        return None
    return {k: str(answer.get(k, "") or "").strip() for k in ("kind", "street", "number", "place")}


# --------------------------------------------------------------------------- what-if questions

def scenario_schema(vehicles, weathers, times, days, sensitivities) -> dict:
    return {
        "type": "object",
        "properties": {
            "vehicle": {"type": "string", "enum": list(vehicles)},
            "weather": {"type": "string", "enum": list(weathers)},
            "time_band": {"type": "string", "enum": list(times)},
            "day": {"type": "string", "enum": list(days)},
            "closed_streets": {"type": "array", "items": {"type": "string"}},
            "avoid_motorways": {"type": "boolean"},
            "max_detour_pct": {"type": "integer", "minimum": 0, "maximum": 200},
            "risk_sensitivity": {"type": "string", "enum": list(sensitivities)},
            "title": {"type": "string"},
        },
        "required": ["vehicle", "weather", "time_band", "day", "closed_streets", "avoid_motorways",
                     "max_detour_pct", "risk_sensitivity", "title"],
    }


SCENARIO_SYSTEM = """You turn a "what if" question about a trip in Madrid into scenario settings (JSON).
Use the defaults unless the question changes them: vehicle = the current vehicle, weather "Any weather",
time_band "Any time", day "Any day", closed_streets [], avoid_motorways false, max_detour_pct = the
current value, risk_sensitivity "Normal".
- Rain, storm, wet roads -> "Rain" ("Heavy rain" if strong). Snow, ice, hail -> "Snow or hail".
- Night, late, after midnight -> "Night (0–6 h)". Rush hour in the morning -> "Morning (6–12 h)".
  After work -> "Evening (18–24 h)". Lunch time -> "Afternoon (12–18 h)".
- Saturday, Sunday, weekend -> "Weekend". Monday to Friday, working day -> "Weekday".
- A street that is closed, cut, blocked or under works -> its name in closed_streets, as written in
  Madrid ("Gran Vía", "Calle de Alcalá").
- "I don't mind a longer trip" -> bigger max_detour_pct (100); "as short as possible" -> 20.
- "as safe as possible", "I'm a beginner" -> risk_sensitivity "Maximum"; "safety matters less" -> "Low".
- Car, motorbike/moto/scooter (Motorcycle), truck/van (Heavy vehicle), bus, bike (Bicycle).
title = a short English title of the scenario. Answer only the JSON."""


SCENARIO_EXAMPLES = [
    ('Current: {"vehicle": "Car", "max_detour_pct": 60}. Question: what if it rains on a Saturday night and Gran Via is closed?',
     {"vehicle": "Car", "weather": "Rain", "time_band": "Night (0–6 h)", "day": "Weekend",
      "closed_streets": ["Gran Vía"], "avoid_motorways": False, "max_detour_pct": 60,
      "risk_sensitivity": "Normal", "title": "Rainy Saturday night, Gran Vía closed"}),
    ('Current: {"vehicle": "Car", "max_detour_pct": 60}. Question: what if Paseo de la Castellana is cut and I go by bus?',
     {"vehicle": "Bus", "weather": "Any weather", "time_band": "Any time", "day": "Any day",
      "closed_streets": ["Paseo de la Castellana"], "avoid_motorways": False, "max_detour_pct": 60,
      "risk_sensitivity": "Normal", "title": "By bus with the Castellana closed"}),
]

# A condition is only kept if the question mentions it (small models copy the examples otherwise).
EVIDENCE = {
    "weather": r"rain|wet|storm|drizzl|snow|ice|icy|hail|cloud|clear|sunny|weather|lluvi|llov|llueve|"
               r"tormenta|niev|nieve|granizo|hielo|nublado|despejado|sol\b",
    "time_band": r"night|late|midnight|dawn|morning|rush|afternoon|lunch|noon|evening|after work|"
                 r"\d\s*(am|pm|h)\b|noche|madrugada|mañana|manana|tarde|mediod|hora punta",
    "day": r"weekend|saturday|sunday|weekday|monday|tuesday|wednesday|thursday|friday|working day|"
           r"workday|fin de semana|sábado|sabado|domingo|lunes|martes|miércoles|miercoles|jueves|viernes|laborable",
}


def interpret_scenario(question: str, current: dict, enums: dict, timeout: float = 60) -> dict | None:
    """What-if question -> scenario fields (validated against `enums`). None if Ollama is down."""
    import re

    schema = scenario_schema(enums["vehicle"], enums["weather"], enums["time_band"], enums["day"],
                             enums["risk_sensitivity"])
    text = f"Current: {json.dumps(current, ensure_ascii=False)}. Question: {question}"
    answer = _chat("scenario", SCENARIO_SYSTEM, SCENARIO_EXAMPLES, schema, text, timeout)
    if answer is None:
        return None
    out = {}
    for key, allowed in enums.items():                 # never trust values outside the enums
        out[key] = answer.get(key) if answer.get(key) in allowed else current.get(key, allowed[0])
        if key in EVIDENCE and not re.search(EVIDENCE[key], question.lower()):
            out[key] = allowed[0]                      # "Any weather" / "Any time" / "Any day"
    out["closed_streets"] = [str(s).strip() for s in answer.get("closed_streets", []) if str(s).strip()][:5]
    out["avoid_motorways"] = bool(answer.get("avoid_motorways", False))
    try:
        out["max_detour_pct"] = max(0, min(200, int(answer.get("max_detour_pct", current.get("max_detour_pct", 60)))))
    except (TypeError, ValueError):
        out["max_detour_pct"] = current.get("max_detour_pct", 60)
    out["title"] = str(answer.get("title", "")).strip()[:80]
    return out
