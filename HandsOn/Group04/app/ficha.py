"""Facility page: facility data, nearest station, linked Wikidata entities and the
air quality history at the nearest station (FR4, FR5, FR8, FR9, FR10)."""
import altair as alt
import streamlit as st

import common
import data
import queries as q


facilities = data.query(q.facilities())
facilities["label"] = facilities["name"].map(common.short_name)
facilities = facilities.sort_values("label").reset_index(drop=True)

# The map links here with ?facility=<readable name of the IRI>
wanted = st.query_params.get("facility")
slugs = facilities["facility"].map(common.slug).tolist()
index = slugs.index(wanted) if wanted in slugs else 0
label = st.selectbox("Instalación", facilities["label"], index=index)
facility = facilities[facilities["label"] == label].iloc[0]["facility"]
st.query_params["facility"] = common.slug(facility)
common.sidebar_footer()

d = data.query(q.facility_details(facility)).iloc[0]
st.title(common.short_name(d["name"]))
address = ", ".join(x for x in [d["street"], d["postalCode"]] if isinstance(x, str))
st.caption(" · ".join(x for x in [address, d["neighbourhood"], d["district"]]
                      if isinstance(x, str)))

left, right = st.columns([1, 2])
with left:
    st.subheader("Instalación")
    st.markdown(f"**Tipo:** {d['types']}")
    for title, key in [("Equipamiento", "equipment"), ("Accesibilidad", "accessibility"),
                       ("Transporte", "transport")]:
        if isinstance(d[key], str):
            st.markdown(f"**{title}:** {d[key]}")
    if isinstance(d["url"], str):
        st.markdown(f"[Página oficial ↗]({d['url']})")
    st.markdown(f"<small>IRI: `{facility}`</small>", unsafe_allow_html=True)

    st.subheader("Estación más cercana")
    st.markdown(f"**{d['stationName']}** ({d['stationType']}) a {d['distance']:.1f} km")

    st.subheader("En Wikidata")
    for kind, key in [("Distrito", "districtWikidata"), ("Barrio", "neighbourhoodWikidata")]:
        if isinstance(d[key], str):
            info = common.wikidata_summary(d[key])
            if info:
                st.markdown(f"**{kind}:** [{info['label']}]({info['url']}) – {info['description']}")
            else:
                st.markdown(f"**{kind}:** [{common.slug(d[key])}]({d[key]})")

with right:
    st.subheader("Aire cerca de esta instalación (2024)")
    measured = data.query(q.station_pollutants(d["station"]))
    if measured.empty:
        st.info("La estación más cercana no mide ninguno de los contaminantes con valor de referencia.")
        st.stop()
    pollutants = common.pollutant_table()
    measured = pollutants[pollutants["pollutant"].isin(measured["pollutant"])]
    name = st.selectbox("Contaminante", measured["name"])
    p = measured[measured["name"] == name].iloc[0]

    series = data.query(q.station_series(d["station"], p["property"]))
    valid = series[series["valid"]]
    above = int((valid["value"] > p["reference"]).sum())

    m1, m2, m3, m4 = st.columns(4)
    m1.metric(f"Días > {p['reference']} {p['unit']}", above)
    m2.metric(f"Media anual ({p['unit']})", f"{valid['value'].mean():.1f}")
    m3.metric(f"Máximo diario ({p['unit']})", f"{valid['value'].max():g}")
    m4.metric("Días sin dato válido", int((~series["valid"]).sum()))

    line = alt.Chart(valid).mark_line().encode(
        x=alt.X("date:T", title="Fecha"),
        y=alt.Y("value:Q", title=f"{name} ({p['unit']})"),
        tooltip=[alt.Tooltip("date:T", title="Fecha"), alt.Tooltip("value:Q", title="Valor")],
    )
    rule = alt.Chart().mark_rule(strokeDash=[6, 4], color="#d7191c").encode(
        y=alt.datum(p["reference"]))
    st.altair_chart(line + rule, width="stretch")
    st.caption(f"Media diaria en la estación {d['stationName']}; la línea discontinua es "
               f"la referencia diaria de la OMS (2021). Valores de la estación más cercana, "
               f"no medidos en la propia instalación. Los datos marcados como no válidos "
               f"por el Ayuntamiento no se usan.")
