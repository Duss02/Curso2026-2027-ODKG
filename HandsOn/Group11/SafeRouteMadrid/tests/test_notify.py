from types import SimpleNamespace

import pandas as pd
import pytest

from safeway import notify, settings


def _route(level, risk, km, minutes, streets=()):
    hot = pd.DataFrame({"street": list(streets), "level": ["High"] * len(streets)})
    return SimpleNamespace(level=level, risk=risk, length_m=km * 1000, minutes=minutes,
                           risk_per_km=risk / km, hotspots=hot)


def test_valid_address():
    assert notify.valid_address("a.b@example.es")
    assert not notify.valid_address("not-an-email")
    assert not notify.valid_address("a@b")


def test_route_message_mentions_alternative():
    trip = {"start": "Moncloa", "end": "Sol", "profile": "Car",
            "result": {"fastest": _route("High", 10, 4.0, 12, ["CALLE DE GOYA"]),
                       "safest": _route("Low", 2, 4.5, 14), "has_alternative": True}}
    subject, body = notify.route_message(trip, "fastest")
    assert "Moncloa → Sol" in subject and "High" in subject
    assert "CALLE DE GOYA" in body
    assert "80% less accident history" in body


def test_send_uses_smtp(monkeypatch):
    sent = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            self.host = host

        def starttls(self, context):
            pass

        def login(self, user, password):
            sent.append(("login", user))

        def send_message(self, msg):
            sent.append(("msg", msg["To"], msg["Subject"]))

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr(notify.smtplib, "SMTP", FakeSMTP)
    cfg = notify.SmtpConfig("smtp.test", 587, "me@test.com", "pw", "me@test.com")
    notify.send("you@test.com", "Hi", "Body", smtp=cfg)
    assert sent == [("login", "me@test.com"), ("msg", "you@test.com", "Hi")]


def test_send_without_config_fails(monkeypatch):
    monkeypatch.setattr(notify, "smtp_config", lambda: None)
    with pytest.raises(RuntimeError, match="No SMTP server"):
        notify.send("you@test.com", "Hi", "Body")


def test_email_settings_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "PATH", tmp_path / "settings.json")
    assert settings.load().email_enabled is False
    settings.save(settings.Settings(email_enabled=True, email_address="x@y.com", email_on_route=False))
    s = settings.load()
    assert (s.email_enabled, s.email_address, s.email_on_route, s.email_on_rebuild) == \
        (True, "x@y.com", False, True)


def test_theme_setting_and_palette(tmp_path, monkeypatch):
    from streamlit import config
    from ui import theme

    monkeypatch.setattr(settings, "PATH", tmp_path / "settings.json")
    settings.save(settings.Settings(theme="Purple"))
    assert settings.load().theme == "Light"
    before = config.get_option("theme.base")
    try:
        assert theme.apply("Dark") is True
        assert config.get_option("theme.base") == "dark"
        assert theme.apply("Dark") is False          # no rerun loop
        assert "--sw-card-bg:#1b2733" in theme.css("Dark")
    finally:
        theme.apply("Light")
        config.set_option("theme.base", before)


def test_send_with_map_embeds_image(monkeypatch):
    sent = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            pass

        def starttls(self, context):
            pass

        def login(self, user, password):
            pass

        def send_message(self, msg):
            sent.append(msg)

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr(notify.smtplib, "SMTP", FakeSMTP)
    cfg = notify.SmtpConfig("smtp.test", 587, "me@test.com", "pw", "me@test.com")
    notify.send("you@test.com", "Hi", "Title\nBody <b>", smtp=cfg, image=b"\x89PNG fake")
    msg = sent[0]
    assert msg.get_body(("plain",)).get_content().strip() == "Title\nBody <b>"
    html = msg.get_body(("html",)).get_content()
    image = next(part for part in msg.walk() if part.get_content_type() == "image/png")
    assert f"cid:{image['Content-ID'][1:-1]}" in html and "Body &lt;b&gt;" in html
    assert image.get_content() == b"\x89PNG fake"


def test_route_png_without_tiles(monkeypatch):
    from ui import static_map

    monkeypatch.setattr(static_map, "_fetch_tile", lambda url: None)   # offline: plain background
    coords = [(40.4346, -3.7189), (40.4300, -3.7100), (40.4168, -3.7038)]

    def route(path):
        hot = pd.DataFrame({"lat": [40.43], "lon": [-3.71], "level": ["High"], "street": ["X"]})
        return SimpleNamespace(coords=path, segment_risk=[0.0, 5.0][:len(path) - 1], hotspots=hot)

    result = {"fastest": route(coords), "safest": route([coords[0], (40.425, -3.72), coords[2]]),
              "has_alternative": True}
    model = SimpleNamespace(hotspot_min_risk=1.0, hotspot_high_risk=4.0)
    for chosen in ("fastest", "safest"):
        png = static_map.route_png(result, model, coords[0], coords[-1], chosen, width=400, height=300)
        assert png.startswith(b"\x89PNG")
