"""Districts: facilities, inhabitants (from Wikidata) and air quality per district,
and the facilities of a sport with the cleanest air (FR6, FR7, FR8)."""
import altair as alt
import streamlit as st

import common
import data
import queries as q

st.title("Distritos")

pollutants = common.pollutant_table()
name = st.sidebar.selectbox("Contaminante", pollutants["name"])
p = pollutants[pollutants["name"] == name].iloc[0]
common.sidebar_footer()

# ------------------------------------------------------------------ FR7, FR8
st.subheader(f"Instalaciones y {name} por distrito")
districts = data.query(q.districts(p["property"]))
districts["stations"] = districts["stations"].fillna(0)
districts["mean"] = districts["mean"].astype(float)

# Linked data: each district of our graph is owl:sameAs its Wikidata entity, so we
# can add data that the City Council datasets do not have (population and area).
districts["qid"] = districts["wikidata"].fillna("").map(common.slug)
qids = tuple(sorted(qid for qid in districts["qid"] if qid))
wikidata = common.wikidata_districts(qids)
if wikidata is not None:
    districts = districts.merge(wikidata, on="qid", how="left")
    districts["per10k"] = districts["facilities"] / districts["population"] * 10000
    districts["density"] = (districts["population"] / districts["area"]).round()
    districts = districts.sort_values("per10k", ascending=False)
    columns = ["name", "facilities", "population", "per10k", "area", "density",
               "stations", "mean", "wikidata"]
else:
    st.warning("No se ha podido consultar Wikidata (¿sin conexión a internet?): "
               "se muestran solo los datos de nuestro grafo.")
    columns = ["name", "facilities", "stations", "mean", "wikidata"]

st.dataframe(
    districts[columns],
    hide_index=True, width="stretch",
    column_config={
        "name": "Distrito",
        "facilities": st.column_config.NumberColumn("Instalaciones", format="%d"),
        "population": st.column_config.NumberColumn("Habitantes (Wikidata)", format="localized"),
        "per10k": st.column_config.NumberColumn("Instalaciones por 10.000 hab.", format="%.1f"),
        "area": st.column_config.NumberColumn("Superficie km² (Wikidata)", format="%.1f"),
        "density": st.column_config.NumberColumn("Hab./km²", format="localized"),
        "stations": st.column_config.NumberColumn(f"Estaciones que miden {name}", format="%d"),
        "mean": st.column_config.NumberColumn(f"Media anual ({p['unit']})", format="%.1f"),
        "wikidata": st.column_config.LinkColumn("Wikidata", display_text="Ver en Wikidata"),
    },
)
st.caption("Media de los valores diarios válidos de 2024 de las estaciones situadas en el "
           "distrito. Vacío: el distrito no tiene ninguna estación que mida este contaminante.")

if wikidata is not None:
    chart = alt.Chart(districts).mark_bar(color="#2c7bb6").encode(
        x=alt.X("per10k:Q", title="Instalaciones por 10.000 habitantes"),
        y=alt.Y("name:N", sort="-x", title=None, axis=alt.Axis(labelLimit=200)),
        tooltip=[alt.Tooltip("name:N", title="Distrito"),
                 alt.Tooltip("facilities:Q", title="Instalaciones"),
                 alt.Tooltip("population:Q", title="Habitantes", format=","),
                 alt.Tooltip("per10k:Q", title="Por 10.000 hab.", format=".1f")])
    st.altair_chart(chart, width="stretch")

# ------------------------------------------------------------------ FR6
st.subheader("¿Dónde hay mejor aire para tu deporte?")
types = data.query(q.facility_types())
type_name = st.selectbox("Tipo de instalación", types["name"],
                         index=int((types["name"] == "Calistenia").idxmax()))
facility_type = types[types["name"] == type_name].iloc[0]["type"]
ranking = data.query(q.ranking(facility_type, p["property"]))
ranking["instalacion"] = ranking["name"].map(common.short_name)
ranking["ficha"] = ranking["facility"].map(
    lambda iri: f"/ficha?facility={common.slug(iri)}")
st.dataframe(
    ranking[["instalacion", "district", "stationName", "distance", "mean", "ficha"]].head(10),
    hide_index=True, width="stretch",
    column_config={
        "instalacion": "Instalación", "district": "Distrito",
        "stationName": "Estación más cercana",
        "distance": st.column_config.NumberColumn("Distancia (km)", format="%.1f"),
        "mean": st.column_config.NumberColumn(f"Media anual de {name} ({p['unit']})", format="%.1f"),
        "ficha": st.column_config.LinkColumn("Ficha", display_text="Ver ficha"),
    },
)
st.caption(f"Las 10 instalaciones de tipo «{type_name}» cuya estación más cercana tuvo la "
           f"media anual más baja. Solo se listan las que tienen cerca una estación que mide "
           f"{name}.")
