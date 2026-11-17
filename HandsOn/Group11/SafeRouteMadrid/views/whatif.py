"""What if…? The same trip under hypothetical conditions, and the best scenario for it."""
from __future__ import annotations

import pandas as pd
import streamlit as st
from streamlit_folium import st_folium

from safeway import config, geocode, llm, scenario as sc, settings
from ui import cache, maps
from ui.components import CARD, _risk_bar, _row
from ui.maps import RISK_COLORS
from ui.search import location_input

prefs = cache.user_settings()
VEHICLES = list(config.VEHICLE_PROFILES)
ENUMS = {"vehicle": VEHICLES, "weather": list(sc.WEATHER), "time_band": list(sc.TIME_BANDS),
         "day": list(sc.DAYS), "risk_sensitivity": list(settings.SENSITIVITY)}
EXAMPLES = ["What if it rains?", "What if I drive at night on a weekend?",
            "What if Gran Vía is closed?", "What if I go by motorbike?",
            "What if I want the safest possible trip and don't mind a detour?"]


@st.cache_data(show_spinner=False)
def street_names() -> list[str]:
    return sorted(geocode._index()[2]["street"].unique())


def _defaults() -> None:
    defaults = {"wi_vehicle": prefs.default_vehicle, "wi_weather": "Any weather", "wi_time": "Any time",
                "wi_day": "Any day", "wi_closed": [], "wi_motorways": prefs.avoid_motorways,
                "wi_detour": prefs.max_detour_pct, "wi_sensitivity": prefs.risk_sensitivity, "wi_title": ""}
    for k, v in defaults.items():
        st.session_state.setdefault(k, v)


def _apply(answer: dict) -> None:
    """Put the AI's reading of the question into the scenario controls."""
    st.session_state.update({
        "wi_vehicle": answer["vehicle"], "wi_weather": answer["weather"], "wi_time": answer["time_band"],
        "wi_day": answer["day"], "wi_motorways": answer["avoid_motorways"],
        "wi_detour": answer["max_detour_pct"], "wi_sensitivity": answer["risk_sensitivity"],
        "wi_title": answer["title"]})
    closed, unknown = [], []
    for name in answer["closed_streets"]:
        hits = geocode.find_street(name, limit=1)
        (closed if hits and hits[0].score >= 85 else unknown).append(hits[0].label if hits else name)
    st.session_state["wi_closed"] = closed
    st.session_state["wi_unknown"] = unknown


def _interpret(question: str) -> None:
    current = {"vehicle": st.session_state["wi_vehicle"], "max_detour_pct": st.session_state["wi_detour"]}
    with st.spinner("The local AI is reading your question…"):
        answer = llm.interpret_scenario(question, current, ENUMS)
    if answer is None:
        st.session_state["wi_error"] = "The local AI (Ollama) is not running: set the scenario by hand below."
    else:
        _apply(answer)
        st.session_state.pop("wi_error", None)


def _card(title: str, result: dict, s: sc.Scenario) -> None:
    usual, safer, model = result["fastest"], result["safest"], result["model"]
    city = max(model.city_risk_per_km, 1e-9)
    body = (f'<div style="font-size:0.85rem;color:var(--sw-muted);margin-bottom:6px">{s.vehicle} · {s.conditions()}'
            + (f' · closed: {", ".join(s.closed_streets)}' if s.closed_streets else "") + "</div>"
            + _row("Usual route:", f'<span style="color:{RISK_COLORS[usual.level]}">{usual.level}</span> '
                   f'· {usual.length_m / 1000:.1f} km · {usual.minutes:.0f} min')
            + _row("Safer route:", f'<span style="color:{RISK_COLORS[safer.level]}">{safer.level}</span> '
                   f'· {safer.length_m / 1000:.1f} km · {safer.minutes:.0f} min')
            + _risk_bar(safer.level)
            + _row("Risk vs Madrid (safer):", f"{safer.risk_per_km / city:.1f}×")
            + _row("Risk locations (safer):", str(len(safer.hotspots)))
            + _row("Accidents behind this:", f"{result['accidents_used']:,}"))
    st.html(f'<div style="{CARD}"><div style="font-weight:700;margin-bottom:6px">{title}</div>{body}</div>')


_defaults()
st.markdown("## What if…?")
st.caption("Ask about a hypothetical trip: rain, night, a weekend, a closed street, another vehicle. "
           "SafeRoute Madrid recomputes the route from only the accidents that happened under those "
           "conditions and compares it with your usual trip.")

trip_col, ask_col = st.columns([1, 1.4], gap="large")
with trip_col:
    start = location_input("From", prefs.default_start, "wi_start")
    end = location_input("To", prefs.default_destination, "wi_end")

with ask_col:
    ai = prefs.ai_search and llm.available()
    question = st.text_input("Your question", key="wi_question",
                             placeholder="What if it rains on Saturday night and Gran Vía is closed?")
    b1, b2 = st.columns([1, 2])
    if b1.button("Ask", type="primary", disabled=not (question and ai), width="stretch"):
        _interpret(question)
    if not ai:
        b2.caption("Start Ollama (and keep AI search on in Options) to ask in plain words. "
                   "You can always set the scenario by hand.")
    st.caption("Try: " + " · ".join(f"*{e}*" for e in EXAMPLES[:3]))
    ex = st.pills("Examples", EXAMPLES, label_visibility="collapsed", key="wi_example")
    if ex and ex != st.session_state.get("wi_last_example") and ai:
        st.session_state["wi_last_example"] = ex
        _interpret(ex)
    if st.session_state.get("wi_error"):
        st.warning(st.session_state["wi_error"])
    if st.session_state.get("wi_unknown"):
        st.warning("Not found in Madrid's streets: " + ", ".join(st.session_state["wi_unknown"]))

with st.expander("Scenario settings" + (f" · {st.session_state['wi_title']}" if st.session_state["wi_title"] else ""),
                 expanded=True):
    c1, c2, c3, c4 = st.columns(4)
    c1.selectbox("Vehicle", VEHICLES, key="wi_vehicle")
    c2.selectbox("Weather", list(sc.WEATHER), key="wi_weather")
    c3.selectbox("Time of day", list(sc.TIME_BANDS), key="wi_time")
    c4.selectbox("Day", list(sc.DAYS), key="wi_day")
    c5, c6, c7 = st.columns([2, 1, 1])
    c5.multiselect("Closed streets", street_names(), key="wi_closed")
    c6.select_slider("Avoid accident history", list(settings.SENSITIVITY), key="wi_sensitivity")
    c7.slider("Max detour (%)", 0, 200, step=10, key="wi_detour")
    st.checkbox("Avoid motorways and trunk roads", key="wi_motorways",
                disabled=st.session_state["wi_vehicle"] == "Bicycle")

scenario = sc.Scenario(
    vehicle=st.session_state["wi_vehicle"], weather=st.session_state["wi_weather"],
    time_band=st.session_state["wi_time"], day=st.session_state["wi_day"],
    closed_streets=tuple(st.session_state["wi_closed"]),
    avoid_motorways=st.session_state["wi_motorways"] and st.session_state["wi_vehicle"] != "Bicycle",
    max_detour_pct=st.session_state["wi_detour"],
    risk_sensitivity=settings.SENSITIVITY[st.session_state["wi_sensitivity"]],
    title=st.session_state["wi_title"])
baseline = sc.Scenario(vehicle=prefs.default_vehicle, max_detour_pct=prefs.max_detour_pct,
                       avoid_motorways=prefs.avoid_motorways and prefs.default_vehicle != "Bicycle",
                       risk_sensitivity=settings.SENSITIVITY[prefs.risk_sensitivity])

if st.button("Run scenario", type="primary", disabled=not (start and end)):
    try:
        with st.spinner("Comparing your usual trip with the scenario…"):
            st.session_state["wi_result"] = {
                "baseline": sc.run(cache.model(baseline.vehicle), baseline, start[1], end[1]),
                "scenario": sc.run(cache.model(scenario.vehicle), scenario, start[1], end[1]),
                "times": sc.best_time(cache.model(scenario.vehicle), scenario, start[1], end[1]),
                "s": scenario, "b": baseline, "start": start, "end": end}
    except ValueError as error:
        st.error(str(error))

res = st.session_state.get("wi_result")
if res:
    left, right = st.columns([1, 1.5], gap="large")
    with left:
        _card("YOUR USUAL TRIP", res["baseline"], res["b"])
        _card(("WHAT IF: " + res["s"].title.upper()) if res["s"].title else "WHAT IF", res["scenario"], res["s"])
        b, s = res["baseline"]["safest"], res["scenario"]["safest"]
        b_rel = b.risk_per_km / max(res["baseline"]["model"].city_risk_per_km, 1e-9)
        s_rel = s.risk_per_km / max(res["scenario"]["model"].city_risk_per_km, 1e-9)
        verdict = ("safer than" if s_rel < b_rel * 0.9 else "riskier than" if s_rel > b_rel * 1.1 else "about as safe as")
        st.info(f"Under this scenario the best route is **{verdict}** your usual trip, compared with Madrid "
                f"under the same conditions ({s_rel:.1f}× vs {b_rel:.1f}× the city average). "
                f"It takes {s.minutes - b.minutes:+.0f} min.")
    with right:
        r = res["scenario"]
        st_folium(maps.route_map(r, r["model"], res["start"][1], res["end"][1], "safest"),
                  height=430, use_container_width=True, returned_objects=[],
                  key=f"wi-map-{hash((res['s'], res['start'][0], res['end'][0]))}")
        st.caption("Scenario routes · blue: safest under the scenario · coloured: usual route under the scenario")

    st.markdown("#### Best time of day for this trip")
    times: pd.DataFrame = res["times"]
    best = times.iloc[0]
    st.caption(f"Same scenario at every time of day. Least accident history on the usual route: "
               f"**{best['Time of day']}**. Risk is relative to all of Madrid at that time, so it is "
               f"not lower just because fewer people travel at night.")
    st.dataframe(times, hide_index=True, width="stretch", column_config={
        "Usual vs Madrid": st.column_config.NumberColumn(format="%.1f×"),
        "Safer vs Madrid": st.column_config.NumberColumn(format="%.1f×")})
    small = times[times["Accidents in data"] < 300]
    if len(small):
        st.caption("⚠ Few accidents match some of these conditions "
                   f"({', '.join(small['Time of day'])}): treat those rows as indicative.")
