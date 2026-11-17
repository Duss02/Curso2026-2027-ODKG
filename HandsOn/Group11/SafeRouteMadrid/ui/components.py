"""Cards and tables shared by the pages, styled after the mock-ups."""
from __future__ import annotations

import html

import streamlit as st

from ui.maps import RISK_COLORS

CARD = ("border:1px solid var(--sw-border);border-radius:12px;padding:14px 16px;margin-bottom:12px;"
        "background:var(--sw-card-bg)")


def _risk_bar(level: str) -> str:
    filled = {"Low": 1, "Medium": 3, "High": 5}[level]
    color = RISK_COLORS[level]
    cells = "".join(f'<span style="flex:1;height:6px;border-radius:3px;background:'
                    f'{color if i < filled else "var(--sw-bar-empty)"}"></span>' for i in range(5))
    return f'<div style="display:flex;gap:4px;margin:8px 0">{cells}</div>'


def _row(label: str, value: str) -> str:
    return (f'<div style="display:flex;justify-content:space-between"><span>{label}</span>'
            f'<b>{value}</b></div>')


def route_card(route, profile: str, title: str) -> None:
    color = RISK_COLORS[route.level]
    body = (_row("Distance:", f"{route.length_m / 1000:.1f} km")
            + _row("Estimated time:", f"{route.minutes:.0f} min")
            + _row("Accident history:", f'<span style="color:{color}">{route.level}</span>')
            + _row("Vehicle:", profile)
            + _risk_bar(route.level)
            + f'<div style="font-size:0.85rem;color:var(--sw-muted)">{route.risk_per_km:.1f} weighted '
              f'accidents per km on this route</div>')
    st.html(f'<div style="{CARD}"><div style="font-weight:700;margin-bottom:6px">{title}</div>{body}</div>')
    high = route.hotspots[route.hotspots["level"] == "High"]
    if len(high):
        st.html(f'<div style="{CARD};border-color:var(--sw-warn-border);background:var(--sw-warn-bg);color:var(--sw-warn-text)">'
                f'<b>⚠ High accident-risk location{"s" if len(high) > 1 else ""} on your route</b><br>'
                f'{len(high)} location{"s" if len(high) > 1 else ""} with a high history of accidents, '
                f'weighted for {html.escape(profile.lower())}s. Based on the 2025–2026 Madrid traffic '
                f'accident data.</div>')


def comparison_card(original, alternative) -> None:
    def col(name, r):
        return (f'<div style="flex:1"><div style="font-weight:700">{name}</div>'
                + _row("Distance:", f"{r.length_m / 1000:.1f} km")
                + _row("Time:", f"{r.minutes:.0f} min")
                + _row("History:", r.level)
                + _row("Risk locations:", str(len(r.hotspots))) + "</div>")
    saved = 1 - alternative.risk / max(original.risk, 1e-9)
    st.html(f'<div style="{CARD}"><div style="font-weight:700;margin-bottom:6px">ROUTE COMPARISON</div>'
            f'<div style="display:flex;gap:18px">{col("Original", original)}'
            f'<div style="border-left:1px solid var(--sw-border)"></div>{col("Alternative", alternative)}</div>'
            f'<div style="font-size:0.85rem;color:var(--sw-soft);margin-top:8px">The alternative passes '
            f'{saved:.0%} less accident history for '
            f'{(alternative.minutes - original.minutes):+.0f} min. You choose between distance, time '
            f'and accident risk.</div></div>')


def risk_table(route, profile: str) -> None:
    hot = route.hotspots
    st.markdown(f"#### Accident-risk locations on this route ({len(hot)})")
    if hot.empty:
        st.caption("No street segment on this route has a notable accident history.")
        return
    table = hot.rename(columns={
        "street": "Street", "level": "Risk", "accidents": "Historical accidents",
        f"same_vehicle_{profile}": f"Involving {profile.lower()}s", "severe": "Serious / fatal",
        "main_type": "Most common accident"})
    st.dataframe(table[["Street", "Risk", "Historical accidents", f"Involving {profile.lower()}s",
                        "Serious / fatal", "Most common accident"]],
                 hide_index=True, width="stretch")
