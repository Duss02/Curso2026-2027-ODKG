"""Options: add more accident CSV files and personal settings."""
from __future__ import annotations

import streamlit as st

from safeway import config, llm, notify, pipeline, queries, rdf, settings
from ui import cache
from ui import theme
from ui.maps import carto_key

st.markdown("## Options")
data_tab, prefs_tab = st.tabs(["📂 Accident data", "⚙️ Personal settings"])

# --------------------------------------------------------------------------- data
with data_tab:
    st.caption("Add another year (or month) of the Madrid open-data traffic accident CSV "
               "(datos.madrid.es, 'Accidentes de tráfico de la Ciudad de Madrid'). Each file is "
               "cleaned, linked to Wikidata, mapped to RDF and loaded as its own named graph; then "
               "the street risk is rebuilt. Raw portal files and cleaned files are both accepted.")
    manifest = rdf.read_manifest()["files"]
    if manifest:
        st.dataframe([{"File": v["file"], "Triples": v["triples"], "Loaded": v["loaded_at"]}
                      for v in manifest.values()], hide_index=True, width="stretch",
                     column_config={"Triples": st.column_config.NumberColumn(format="%d")})
    uploads = st.file_uploader("CSV files", type="csv", accept_multiple_files=True)
    c1, c2 = st.columns(2)
    force = c1.checkbox("Re-process files already loaded")
    remove = c2.multiselect("Remove files", [v["file"] for v in manifest.values()])
    if st.button("Apply and rebuild", type="primary",
                 disabled=not (uploads or force or remove or not pipeline.is_built())):
        config.RAW_DIR.mkdir(parents=True, exist_ok=True)
        for f in uploads or []:
            (config.RAW_DIR / f.name).write_bytes(f.getvalue())
        for name in remove:
            (config.RAW_DIR / name).unlink(missing_ok=True)
        with st.status("Building…", expanded=True) as status:
            try:
                summary = pipeline.build(force=force, store=cache.store(), log=st.write)
            except Exception as error:
                status.update(label="Build failed", state="error")
                st.exception(error)
            else:
                cache.clear()
                rejected = summary.get("rejected", {})
                for stem, reason in rejected.items():
                    (config.RAW_DIR / f"{stem}.csv").unlink(missing_ok=True)
                    st.error(reason)
                status.update(label="Done: the routes now use the new data",
                              state="error" if rejected else "complete")
                prefs = settings.load()
                if prefs.email_enabled and prefs.email_on_rebuild and prefs.email_address:
                    files = ", ".join(v["file"] for v in rdf.read_manifest()["files"].values())
                    try:
                        notify.send(prefs.email_address, "SafeRoute: accident data rebuilt",
                                    "The SafeRoute Madrid accident data was rebuilt; routes now "
                                    f"use the new data.\n\nLoaded files: {files or 'none'}\n"
                                    + "".join(f"Rejected: {r}\n" for r in rejected.values()))
                    except Exception as error:
                        st.warning(f"Rebuild email not sent: {error}")
        dup = queries.duplicate_accidents(cache.store())
        if dup:
            st.warning(f"{dup:,} accidents appear in more than one file (the same data was added "
                       "twice). Remove one of the files above.")
    st.caption("Close any other SafeRoute Madrid window or `scripts\\build.py` run first: the triplestore can "
               "be opened by one process at a time.")

# --------------------------------------------------------------------------- personal settings
with prefs_tab:
    s = settings.load()
    vehicles = list(config.VEHICLE_PROFILES)
    with st.form("prefs"):
        st.markdown("**Your trips**")
        c1, c2, c3 = st.columns(3)
        vehicle = c1.selectbox("Default vehicle", vehicles, index=vehicles.index(s.default_vehicle))
        start = c2.text_input("Default start (home)", s.default_start)
        dest = c3.text_input("Default destination", s.default_destination)

        st.markdown("**Safer route**")
        c1, c2 = st.columns(2)
        sensitivity = c1.select_slider(
            "How hard to avoid accident history", list(settings.SENSITIVITY), s.risk_sensitivity,
            help="Higher = the safer route accepts more time to avoid streets with accidents.")
        detour = c2.slider("Longest detour accepted (% over the fastest route)", 0, 200,
                           s.max_detour_pct, step=10)
        motorways = st.checkbox("Avoid motorways and trunk roads (M-30, A-roads…)", s.avoid_motorways,
                                help="Motor vehicles only.")

        st.markdown("**Appearance, map and search**")
        c0, c1, c2 = st.columns(3)
        look = c0.radio("Theme", theme.THEMES, index=theme.THEMES.index(s.theme)
                        if s.theme in theme.THEMES else 0, horizontal=True,
                        help="Light or dark colours for the app (and the CARTO map tiles).")
        styles = ["CARTO light", "OpenStreetMap"]
        style = c1.radio("Map style", styles, index=styles.index(s.map_style), horizontal=True,
                         help=None if carto_key() else "CARTO needs a key in .streamlit/secrets.toml; "
                                                      "without it OpenStreetMap is used.")
        ai = c2.toggle("AI search (local, Ollama)", s.ai_search,
                       help="Understands free text like 'near the Bernabéu'. Off = simple text rules.")

        st.markdown("**Email notifications** (optional)")
        email_on = st.toggle("Send me email notifications", s.email_enabled,
                             help="Needs an SMTP server in .streamlit/secrets.toml ([smtp] section).")
        c1, c2, c3 = st.columns([2, 1, 1])
        email = c1.text_input("Email address", s.email_address, placeholder="you@example.com")
        on_route = c2.checkbox("Route summary after each calculation", s.email_on_route)
        on_rebuild = c3.checkbox("When a data rebuild finishes", s.email_on_rebuild)

        if st.form_submit_button("Save settings", type="primary"):
            email = email.strip()
            if email_on and not notify.valid_address(email):
                st.error("Enter a valid email address, or turn email notifications off.")
            else:
                settings.save(settings.Settings(
                    default_vehicle=vehicle, default_start=start.strip() or "Moncloa",
                    default_destination=dest.strip() or "Puerta del Sol",
                    risk_sensitivity=sensitivity, max_detour_pct=detour, avoid_motorways=motorways,
                    map_style=style, ai_search=ai, theme=look, email_enabled=email_on,
                    email_address=email, email_on_route=on_route, email_on_rebuild=on_rebuild))
                if look != s.theme:
                    st.rerun()   # app.py applies the new theme
                st.success("Saved. Plan a route and What if now use these settings.")

    if s.email_enabled and s.email_address:
        if st.button(f"📧 Send a test email to {s.email_address}"):
            try:
                with st.spinner("Sending…"):
                    notify.send(s.email_address, "SafeRoute: test email",
                                "Email notifications from SafeRoute Madrid are working.")
            except Exception as error:
                st.error(f"Could not send: {error}")
            else:
                st.success("Test email sent.")

    st.caption(f"Local AI: {'🟢 ' + llm.MODEL + ' ready' if llm.available() else '⚪ not running (start Ollama)'}"
               f" · Map tiles: {'CARTO (key found)' if carto_key() else 'OpenStreetMap (no CARTO key)'}"
               f" · Email: {'SMTP configured' if notify.smtp_config() else 'no SMTP server configured'}"
               f" · Settings file: data/settings.json")
    if st.button("Reset to defaults"):
        settings.save(settings.Settings())
        st.rerun()
