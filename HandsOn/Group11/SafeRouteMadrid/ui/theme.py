"""Light and dark themes, chosen on the Options page (settings.theme).

Streamlit sends its theme to the browser at the start of every script run, read from the
[theme] config options, so app.py sets those options from the saved setting and reruns once
when they change. The HTML cards (ui/components.py, the footer) use the --sw-* CSS variables
injected by css(), so they follow the same theme.
"""
from __future__ import annotations

from streamlit import config

THEMES = ("Light", "Dark")

STREAMLIT = {   # Streamlit [theme] options; Light matches .streamlit/config.toml
    "Light": {"base": "light", "primaryColor": "#236a8c", "backgroundColor": "#f4f7f6",
              "secondaryBackgroundColor": "#ffffff", "textColor": "#2c3e50"},
    "Dark": {"base": "dark", "primaryColor": "#4fa3c7", "backgroundColor": "#0f1720",
             "secondaryBackgroundColor": "#1b2733", "textColor": "#e2e8f0"},
}

CSS_VARS = {    # colours of the hand-written HTML
    "Light": {"card-bg": "#ffffff", "border": "#e2e8f0", "muted": "#718096", "soft": "#4a5568",
              "bar-empty": "#e2e8f0", "warn-bg": "#fff5f5", "warn-border": "#feb2b2",
              "warn-text": "#742a2a"},
    "Dark": {"card-bg": "#1b2733", "border": "#2d3b4a", "muted": "#94a3b8", "soft": "#cbd5e1",
             "bar-empty": "#334155", "warn-bg": "#3b1d1d", "warn-border": "#9b2c2c",
             "warn-text": "#fed7d7"},
}


def _name(theme: str) -> str:
    return theme if theme in THEMES else "Light"


def apply(theme: str) -> bool:
    """Set Streamlit's theme options; True if anything changed (the caller should rerun)."""
    changed = False
    for key, value in STREAMLIT[_name(theme)].items():
        option = f"theme.{key}"
        if config.get_option(option) != value:
            config.set_option(option, value)
            changed = True
    return changed


def css(theme: str) -> str:
    variables = ";".join(f"--sw-{k}:{v}" for k, v in CSS_VARS[_name(theme)].items())
    return f"<style>:root{{{variables}}}</style>"
