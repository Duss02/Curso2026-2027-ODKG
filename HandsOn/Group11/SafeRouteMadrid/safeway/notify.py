"""Optional email notifications (turned on in Options > Personal settings).

Mail goes out through an SMTP server configured in .streamlit/secrets.toml:

    [smtp]
    host = "smtp.gmail.com"
    port = 587                 # 465 = SSL, anything else = STARTTLS
    user = "you@gmail.com"
    password = "app password"
    sender = "you@gmail.com"   # optional, defaults to user

or with the environment variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SENDER.
Without that configuration notifications are simply not sent; the app works the same.
"""
from __future__ import annotations

import os
import re
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import make_msgid
from html import escape

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass
class SmtpConfig:
    host: str
    port: int
    user: str
    password: str
    sender: str


def valid_address(address: str) -> bool:
    return bool(EMAIL_RE.match(address.strip()))


def smtp_config() -> SmtpConfig | None:
    """SMTP server from .streamlit/secrets.toml ([smtp]) or SMTP_* environment variables."""
    section: dict = {}
    try:
        import streamlit as st
        section = dict(st.secrets.get("smtp", {}))
    except Exception:  # no secrets file, or running outside Streamlit
        pass

    def get(key: str, default: str = "") -> str:
        return str(section.get(key) or os.environ.get(f"SMTP_{key.upper()}") or default)

    host = get("host")
    if not host:
        return None
    user = get("user")
    return SmtpConfig(host, int(get("port", "587")), user, get("password"), get("sender", user))


def send(to: str, subject: str, body: str, smtp: SmtpConfig | None = None,
         image: bytes | None = None) -> None:
    """Send an email: plain text, plus an HTML version with `image` (PNG bytes, e.g. the route
    map) shown inline when given. Raises RuntimeError / smtplib errors on failure."""
    smtp = smtp or smtp_config()
    if smtp is None:
        raise RuntimeError("No SMTP server configured: add an [smtp] section to "
                           ".streamlit/secrets.toml.")
    if not valid_address(to):
        raise RuntimeError(f"Not a valid email address: {to!r}")
    msg = EmailMessage()
    msg["From"] = smtp.sender or smtp.user
    msg["To"] = to.strip()
    msg["Subject"] = subject
    msg.set_content(body)
    if image:
        cid = make_msgid(domain="saferoute.local")
        msg.add_alternative(_html(body, cid[1:-1]), subtype="html")
        msg.get_payload()[1].add_related(image, "image", "png", cid=cid, filename="route-map.png")
    context = ssl.create_default_context()
    if smtp.port == 465:
        server = smtplib.SMTP_SSL(smtp.host, smtp.port, context=context, timeout=20)
    else:
        server = smtplib.SMTP(smtp.host, smtp.port, timeout=20)
        server.starttls(context=context)
    with server:
        if smtp.user:
            server.login(smtp.user, smtp.password)
        server.send_message(msg)


def _html(body: str, cid: str) -> str:
    """HTML version of a text email: first line as the title, then the map, then the rest."""
    title, _, rest = body.partition("\n")
    return f"""<html><body style="font-family:Segoe UI,Arial,sans-serif;color:#2d3748;max-width:800px">
<h3 style="margin:0 0 12px">{escape(title)}</h3>
<img src="cid:{cid}" alt="Route map" width="800" style="width:100%;max-width:800px;border-radius:8px;border:1px solid #e2e8f0">
<p style="font-size:12px;color:#718096;margin:4px 0 12px">Grey: no recorded accidents · green/orange/red: increasing
accident history · blue: safer alternative · ▲ accident-risk locations · A: start · B: destination</p>
<pre style="font-family:inherit;font-size:14px;white-space:pre-wrap;margin:0">{escape(rest.strip())}</pre>
</body></html>"""


def route_message(trip: dict, chosen: str) -> tuple[str, str]:
    """Subject and body summarising a calculated trip (the dict saved by the Plan page)."""
    result = trip["result"]
    route = result[chosen]
    lines = [
        f"SafeRoute Madrid: {trip['start']} → {trip['end']} ({trip['profile']})",
        "",
        f"{'Safer' if chosen == 'safest' else 'Your'} route",
        f"  Distance: {route.length_m / 1000:.1f} km",
        f"  Estimated time: {route.minutes:.0f} min",
        f"  Accident history: {route.level} ({route.risk_per_km:.1f} weighted accidents per km)",
        f"  Accident-risk locations: {len(route.hotspots)}",
    ]
    high = route.hotspots[route.hotspots["level"] == "High"]
    if len(high):
        lines += ["", "High accident-risk locations on this route:"]
        lines += [f"  - {street}" for street in high["street"].head(10)]
    if result.get("has_alternative") and chosen == "fastest":
        alt = result["safest"]
        saved = 1 - alt.risk / max(route.risk, 1e-9)
        lines += ["", f"A safer alternative exists: {alt.length_m / 1000:.1f} km, "
                      f"{alt.minutes:.0f} min, {saved:.0%} less accident history."]
    lines += ["", "Based on the 2025–2026 Madrid traffic accident open data.",
              "You receive this because email notifications are on in SafeRoute Madrid > Options."]
    subject = f"SafeRoute: {trip['start']} → {trip['end']} ({route.level} risk)"
    return subject, "\n".join(lines)
