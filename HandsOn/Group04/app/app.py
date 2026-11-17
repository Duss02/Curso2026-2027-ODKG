"""Breathe & Play Madrid - web application over our knowledge graph.

Run from the HandsOn/Group04 folder:
    streamlit run app/app.py
"""
import streamlit as st

st.set_page_config(page_title="Breathe & Play Madrid", layout="wide")

pages = st.navigation([
    st.Page("mapa.py", title="Mapa", url_path="mapa", default=True),
    st.Page("ficha.py", title="Ficha de la instalación", url_path="ficha"),
    st.Page("distritos.py", title="Distritos", url_path="distritos"),
])
pages.run()
