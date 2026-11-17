"""Map page: sports facilities coloured by the air quality measured at their
nearest monitoring station (FR1, FR2, FR3)."""
import datetime as dt

import folium
import streamlit as st

import common
import data
import queries as q

st.title("Breathe & Play Madrid")
st.caption("Instalaciones deportivas básicas de Madrid y la calidad del aire en su "
           "estación de control más cercana (datos diarios de 2024).")

facilities = data.query(q.facilities())
stations = data.query(q.stations())
pollutants = common.pollutant_table()
dates = data.query(q.date_range()).iloc[0]
first = dt.date.fromisoformat(dates["first"])
last = dt.date.fromisoformat(dates["last"])

# ------------------------------------------------------------------ filters (FR2)
st.sidebar.header("Filtros")
types = sorted({t for ts in facilities["types"].dropna() for t in ts.split(" | ")})
chosen_types = st.sidebar.multiselect("Tipo de instalación", types,
                                      placeholder="Todos los tipos")
districts = sorted(facilities["district"].dropna().unique())
chosen_district = st.sidebar.selectbox("Distrito", ["Todos"] + districts)
accessible_only = st.sidebar.checkbox("Solo instalaciones accesibles")

st.sidebar.header("Calidad del aire")
pollutant_name = st.sidebar.selectbox("Contaminante", pollutants["name"])
pollutant = pollutants[pollutants["name"] == pollutant_name].iloc[0]
day = st.sidebar.date_input("Fecha", value=dt.date(2024, 1, 15),
                            min_value=first, max_value=last, format="DD/MM/YYYY")
show_stations = st.sidebar.checkbox("Mostrar las estaciones de control", value=True)
common.sidebar_footer()

selected = facilities.copy()
if chosen_types:
    selected = selected[selected["types"].fillna("").map(
        lambda ts: any(t in ts.split(" | ") for t in chosen_types))]
if chosen_district != "Todos":
    selected = selected[selected["district"] == chosen_district]
if accessible_only:
    selected = selected[selected["accessibility"] == "Accesible"]

# ------------------------------------------------- air quality of the day (FR3)
values = data.query(q.values_on_day(pollutant["property"], day.isoformat()))
values = values.rename(columns={"value": "valor", "valid": "valido"})
selected = selected.merge(values, on="station", how="left")
selected["calidad"] = [common.category(v, ok, pollutant["reference"])
                       for v, ok in zip(selected["valor"], selected["valido"])]

# ------------------------------------------------------------------- map (FR1)
counts = selected["calidad"].value_counts()
cols = st.columns(len(common.CATEGORIES))
for col, (name, colour) in zip(cols, common.CATEGORIES.items()):
    col.markdown(f"<span style='color:{colour};font-size:1.3em'>●</span> **{name}**: "
                 f"{counts.get(name, 0)}", unsafe_allow_html=True)
st.caption(f"{pollutant_name} el {day:%d/%m/%Y}. Referencia diaria (OMS 2021): "
           f"{pollutant['reference']} {pollutant['unit']}. Bueno ≤ referencia, "
           f"Moderado ≤ 2 × referencia, Malo > 2 × referencia. Los valores no válidos "
           f"no se usan.")

m = folium.Map(location=[40.42, -3.70], zoom_start=11, tiles="OpenStreetMap")
for _, f in selected.iterrows():
    value = "—" if f["valor"] != f["valor"] else f"{f['valor']:g} {pollutant['unit']}"
    link = f"/ficha?facility={common.slug(f['facility'])}"
    popup = (f"<b>{common.short_name(f['name'])}</b><br>{f['types'] or ''}<br>"
             f"{f['district'] or ''}<br>Estación más cercana: {f['stationName']} "
             f"({f['distance']:.1f} km)<br>{pollutant_name}: {value} "
             f"(<b>{f['calidad']}</b>)<br><a href='{link}' target='_blank'>Ver ficha →</a>")
    folium.CircleMarker(
        location=[f["lat"], f["long"]], radius=6, weight=1, color="#333333",
        fill=True, fill_color=common.CATEGORIES[f["calidad"]], fill_opacity=0.9,
        tooltip=f"{common.short_name(f['name'])} – {f['calidad']}",
        popup=folium.Popup(popup, max_width=320),
    ).add_to(m)
if show_stations:
    station_values = stations.merge(values, on="station", how="left")
    for _, s in station_values.iterrows():
        value = "no mide este contaminante" if s["valor"] != s["valor"] \
            else f"{s['valor']:g} {pollutant['unit']}"
        folium.Marker(
            location=[s["lat"], s["long"]],
            icon=folium.DivIcon(
                html="<div style='width:12px;height:12px;background:#fff;"
                     "border:2px solid #000'></div>",
                icon_size=(16, 16), icon_anchor=(8, 8)),
            tooltip=f"Estación {s['name']} ({s['stationType']}): {value}",
        ).add_to(m)

map_html = m.get_root().render()
if hasattr(st, "iframe"):  # Streamlit >= 1.52
    st.iframe(map_html, height=560)
else:
    import streamlit.components.v1 as components
    components.html(map_html, height=560)
st.caption("■ Estación de control · ● Instalación deportiva. El aire se aproxima con la "
           "estación más cercana: no se mide en la propia instalación.")

# ------------------------------------------------------------------- table
st.subheader(f"{len(selected)} instalaciones")
table = selected.assign(
    instalacion=selected["name"].map(common.short_name),
    ficha=selected["facility"].map(lambda iri: f"/ficha?facility={common.slug(iri)}"),
)[["instalacion", "types", "district", "accessibility", "stationName", "distance",
   "valor", "calidad", "ficha"]]
st.dataframe(
    table.sort_values("instalacion"), hide_index=True, width="stretch",
    column_config={
        "instalacion": "Instalación", "types": "Tipo", "district": "Distrito",
        "accessibility": "Accesibilidad", "stationName": "Estación más cercana",
        "distance": st.column_config.NumberColumn("Distancia (km)", format="%.1f"),
        "valor": st.column_config.NumberColumn(f"{pollutant_name} ({pollutant['unit']})"),
        "calidad": "Calidad del aire",
        "ficha": st.column_config.LinkColumn("Ficha", display_text="Ver ficha"),
    },
)
