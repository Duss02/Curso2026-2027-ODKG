"""Folium maps: routes coloured by risk, hotspot warnings, start/end pins."""
from __future__ import annotations

import html
import os

import folium

RISK_COLORS = {"Low": "#2f855a", "Medium": "#dd8a1a", "High": "#c53030"}
FASTEST_COLOR = "#4a5568"
SAFE_COLOR = "#2b6cb0"
MADRID_CENTER = (40.4168, -3.7038)

CARTO_URL = "https://basemaps.cartocdn.com/rastertiles/{style}/{{z}}/{{x}}/{{y}}{{r}}.png?key={key}"
CARTO_ATTRIBUTION = ('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
                     'contributors, © <a href="https://carto.com/attributions">CARTO</a>')


def carto_key() -> str | None:
    """CARTO basemaps key from .streamlit/secrets.toml (CARTO_API_KEY) or the environment."""
    try:
        import streamlit as st
        key = st.secrets.get("CARTO_API_KEY")
    except Exception:  # no secrets file, or running outside Streamlit
        key = None
    return key or os.environ.get("CARTO_API_KEY") or None


def base_map(center=MADRID_CENTER, zoom=13) -> folium.Map:
    """CARTO Positron (Dark Matter in the dark theme) tiles with a key; plain OpenStreetMap tiles otherwise (no key needed)."""
    key, dark = carto_key(), False
    try:
        from safeway import settings
        prefs = settings.load()
        dark = prefs.theme == "Dark"
        if prefs.map_style == "OpenStreetMap":
            key = None
    except Exception:
        pass
    if key:
        m = folium.Map(location=center, zoom_start=zoom, control_scale=True, tiles=None)
        style, name = ("dark_all", "CARTO Dark Matter") if dark else ("light_all", "CARTO Positron")
        folium.TileLayer(CARTO_URL.format(style=style, key=key), attr=CARTO_ATTRIBUTION, name=name,
                         max_native_zoom=18, max_zoom=20).add_to(m)
        return m
    return folium.Map(location=center, zoom_start=zoom, tiles="OpenStreetMap", control_scale=True)


def _warning_icon(level: str) -> folium.DivIcon:
    color = RISK_COLORS.get(level, RISK_COLORS["Medium"])
    return folium.DivIcon(html=f"""
        <div style="width:26px;height:26px;transform:translate(-13px,-13px);">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2 1 21h22L12 2z" fill="{color}"
            stroke="white" stroke-width="1.5"/><rect x="11" y="8" width="2" height="7" fill="white"/>
            <rect x="11" y="16.5" width="2" height="2" fill="white"/></svg></div>""")


def _pin(m, point, color, label):
    folium.Marker(point, tooltip=label, icon=folium.Icon(color=color, icon="map-marker", prefix="fa")).add_to(m)


def hotspot_popup(row, profile: str) -> str:
    return (f"<b>ACCIDENT-RISK LOCATION</b><br>{html.escape(row['street'])}<br>"
            f"Risk: <b>{row['level']}</b><br>Historical accidents: <b>{int(row['accidents'])}</b><br>"
            f"Involving {profile.lower()}s: <b>{int(row[f'same_vehicle_{profile}'])}</b><br>"
            f"Serious or fatal injuries: <b>{int(row['severe'])}</b><br>"
            f"Most common: {html.escape(str(row['main_type'] or '-'))}")


def step_color(model, r: float) -> str:
    if r <= 0:
        return FASTEST_COLOR
    if r >= model.hotspot_high_risk:
        return RISK_COLORS["High"]
    return RISK_COLORS["Medium"] if r >= model.hotspot_min_risk else RISK_COLORS["Low"]


def route_map(result: dict, model, origin, destination, chosen: str = "fastest") -> folium.Map:
    fastest, safest = result["fastest"], result["safest"]
    profile = model.profile
    m = base_map()
    # fastest route, each step coloured by the history of its street segment
    for (a, b), r in zip(zip(fastest.coords[:-1], fastest.coords[1:]), fastest.segment_risk):
        color = step_color(model, r)
        folium.PolyLine([a, b], color=color, weight=7 if chosen == "fastest" else 4,
                        opacity=0.95 if chosen == "fastest" else 0.5).add_to(m)
    if result["has_alternative"]:
        folium.PolyLine(safest.coords, color=SAFE_COLOR, weight=7 if chosen == "safest" else 4,
                        dash_array=None if chosen == "safest" else "8 8",
                        opacity=0.95 if chosen == "safest" else 0.7, tooltip="Safer alternative").add_to(m)
    shown = fastest if chosen == "fastest" else safest
    for _, row in shown.hotspots.head(25).iterrows():
        folium.Marker((row["lat"], row["lon"]), icon=_warning_icon(row["level"]),
                      popup=folium.Popup(hotspot_popup(row, profile), max_width=260)).add_to(m)
    _pin(m, origin, "green", "Start")
    _pin(m, destination, "red", "Destination")
    pts = fastest.coords + (safest.coords if result["has_alternative"] else [])
    m.fit_bounds([(min(p[0] for p in pts), min(p[1] for p in pts)),
                  (max(p[0] for p in pts), max(p[1] for p in pts))], padding=(30, 30))
    return m


def hotspot_map(seg, profile: str, limit: int = 400) -> folium.Map:
    m = base_map(zoom=12)
    top = seg.sort_values(f"risk_{profile}", ascending=False).head(limit)
    peak = max(top[f"risk_{profile}"].max(), 1e-9) if len(top) else 1
    for _, row in top.iterrows():
        r = row[f"risk_{profile}"]
        folium.CircleMarker((row["lat"], row["lon"]), radius=4 + 12 * (r / peak) ** 0.5,
                            color=RISK_COLORS[row["level"]], fill=True, fill_opacity=0.6, weight=1,
                            popup=folium.Popup(hotspot_popup(row, profile), max_width=260)).add_to(m)
    return m

