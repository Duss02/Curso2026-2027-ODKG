"""Madrid's accident hotspots for one vehicle type."""
from __future__ import annotations

import streamlit as st
from streamlit_folium import st_folium

from safeway import config
from ui import cache, maps

st.markdown("## Accident hotspots")
profile = st.selectbox("Vehicle type", list(config.VEHICLE_PROFILES), key="hot_profile")
model = cache.model(profile)
seg = model.segments
seg = seg[seg["accidents"] >= config.HOTSPOT_MIN_ACCIDENTS].copy()
seg = seg[seg[f"risk_{profile}"] >= model.hotspot_min_risk]
seg["level"] = (seg[f"risk_{profile}"] >= model.hotspot_high_risk).map({True: "High", False: "Medium"})
seg = seg.sort_values(f"risk_{profile}", ascending=False)

meta = cache.meta()
c1, c2, c3 = st.columns(3)
c1.metric("Accidents in the data", f"{meta['accidents']:,}")
c2.metric("Hotspot street segments", f"{len(seg):,}")
c3.metric(f"High-risk for {profile.lower()}s", f"{(seg['level'] == 'High').sum():,}")

st_folium(maps.hotspot_map(seg, profile), height=560, use_container_width=True, returned_objects=[],
          key=f"hot-{profile}")
st.caption("Circle size: weighted accident history (severity × vehicle type). Busy avenues carry "
           "more traffic and so collect more accidents: this is history, not a prediction.")
st.dataframe(
    seg.rename(columns={"street": "Street", "level": "Risk", "accidents": "Accidents",
                        f"same_vehicle_{profile}": f"Involving {profile.lower()}s",
                        "severe": "Serious / fatal", "main_type": "Most common",
                        f"risk_{profile}": "Weighted risk"})
    [["Street", "Risk", "Accidents", f"Involving {profile.lower()}s", "Serious / fatal",
      "Most common", "Weighted risk"]].head(200),
    hide_index=True, width="stretch",
    column_config={"Weighted risk": st.column_config.NumberColumn(format="%.1f")})
