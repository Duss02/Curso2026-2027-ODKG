"""Plan a route: the three screens of the mock-ups (trip configuration, route overview with
hazard warnings, alternative route comparison) on one page."""
from __future__ import annotations

import streamlit as st
from streamlit_folium import st_folium

from safeway import config, notify, routing
from ui import cache, maps, static_map
from ui.components import comparison_card, route_card, risk_table
from ui.search import location_input

prefs = cache.user_settings()
vehicles = list(config.VEHICLE_PROFILES)


def email_route(trip: dict, chosen: str) -> None:
    """Email the trip summary with a picture of the map (sent without it if drawing fails)."""
    try:
        image = static_map.route_png(trip["result"], cache.model(trip["profile"]),
                                     trip["origin"], trip["destination"], chosen)
    except Exception:
        image = None
    notify.send(prefs.email_address, *notify.route_message(trip, chosen), image=image)


left, right = st.columns([1, 2.2], gap="large")

with left:
    st.markdown("## SafeRoute Madrid")
    st.caption("Safer navigation through Madrid")
    start = location_input("Starting point", prefs.default_start, "start")
    end = location_input("Destination", prefs.default_destination, "end")
    profile = st.selectbox("Vehicle type", vehicles, index=vehicles.index(prefs.default_vehicle), key="profile")
    st.caption("Risk estimates are adapted to the selected vehicle type.")
    if st.button("Calculate route", type="primary", width="stretch", disabled=not (start and end)):
        model = cache.model(profile)
        try:
            with st.spinner("Calculating fastest and safest routes…"):
                result = routing.route(model, start[1], end[1], penalty=prefs.penalty_seconds,
                                       max_detour=prefs.max_detour,
                                       avoid_motorways=prefs.avoid_motorways and profile != "Bicycle")
        except Exception as error:
            st.error(f"No route found: {error}")
        else:
            st.session_state["trip"] = {"result": result, "profile": profile, "start": start[0],
                                        "end": end[0], "origin": start[1],
                                        "destination": end[1], "chosen": "fastest"}
            if prefs.email_enabled and prefs.email_on_route and prefs.email_address:
                try:
                    email_route(st.session_state["trip"], "fastest")
                    st.toast(f"Route summary emailed to {prefs.email_address}", icon="📧")
                except Exception as error:
                    st.warning(f"Route email not sent: {error}")

trip = st.session_state.get("trip")
with right:
    if not trip:
        st.info("Choose a start, a destination and your vehicle, then **Calculate route**. "
                "Streets are coloured by their accident history in 2025–2026 and the app looks "
                "for a safer alternative.")
        st_folium(maps.base_map(zoom=12), height=560, use_container_width=True, returned_objects=[])
    else:
        model = cache.model(trip["profile"])
        result = trip["result"]
        map_col, card_col = st.columns([1.6, 1], gap="medium")
        with map_col:
            st_folium(maps.route_map(result, model, trip["origin"], trip["destination"], trip["chosen"]),
                      height=600, use_container_width=True, returned_objects=[],
                      key=f"route-{trip['start']}-{trip['end']}-{trip['profile']}-{trip['chosen']}")
            st.caption("Grey: no recorded accidents · green/orange/red: increasing history · "
                       "blue dashed: safer alternative · ⚠ accident-risk locations (click for details)")
        with card_col:
            chosen = result[trip["chosen"]]
            route_card(chosen, trip["profile"], "YOUR ROUTE" if trip["chosen"] == "fastest" else "SAFER ROUTE")
            if result["has_alternative"]:
                comparison_card(result["fastest"], result["safest"])
                b1, b2 = st.columns(2)
                if b1.button("Select alternative", type="primary", width="stretch",
                             disabled=trip["chosen"] == "safest"):
                    trip["chosen"] = "safest"
                    st.rerun()
                if b2.button("Keep original", width="stretch", disabled=trip["chosen"] == "fastest"):
                    trip["chosen"] = "fastest"
                    st.rerun()
            else:
                st.success("This is already the safest reasonable route: no alternative avoids "
                           "risky streets without a long detour.")
            if prefs.email_enabled and prefs.email_address:
                if st.button("📧 Email this route", width="stretch"):
                    try:
                        email_route(trip, trip["chosen"])
                        st.toast(f"Sent to {prefs.email_address}", icon="📧")
                    except Exception as error:
                        st.error(f"Not sent: {error}")
        risk_table(result[trip["chosen"]], trip["profile"])
