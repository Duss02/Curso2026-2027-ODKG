"""Static PNG of a route map, for emails: the same drawing as ui.maps.route_map (risk-coloured
fastest route, blue safer alternative, accident-risk warnings, start/end pins) over map tiles.

Tiles are CARTO Positron when a CARTO key is set (and the map style is not OpenStreetMap),
OpenStreetMap otherwise. A tile that cannot be downloaded is left as a plain background, so
the image is always produced.
"""
from __future__ import annotations

import io
import math
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image, ImageDraw, ImageFont

from ui.maps import FASTEST_COLOR, RISK_COLORS, SAFE_COLOR, carto_key, step_color

TILE = 256
SCALE = 2                       # overlay drawn at 2x and scaled down: smooth lines
BACKGROUND = (236, 236, 233)
USER_AGENT = "SafeRoute-Madrid/1.0 (route map for email notifications)"
OSM_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
CARTO_TILE = "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key={key}"
ATTRIBUTION = "© OpenStreetMap contributors"


def _world_px(lat: float, lon: float, zoom: int) -> tuple[float, float]:
    """Web Mercator pixel position at this zoom."""
    size = TILE * 2 ** zoom
    s = math.sin(math.radians(lat))
    return (lon + 180) / 360 * size, (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * size


def _fit_zoom(points, width: int, height: int, pad: int) -> int:
    for zoom in range(17, 9, -1):
        xs, ys = zip(*(_world_px(lat, lon, zoom) for lat, lon in points))
        if max(xs) - min(xs) <= width - 2 * pad and max(ys) - min(ys) <= height - 2 * pad:
            return zoom
    return 10


def _tile_url() -> tuple[str, str]:
    key = carto_key()
    try:
        from safeway import settings
        if settings.load().map_style == "OpenStreetMap":
            key = None
    except Exception:
        pass
    if key:
        return CARTO_TILE.replace("{key}", key), ATTRIBUTION + ", © CARTO"
    return OSM_TILE, ATTRIBUTION


def _fetch_tile(url: str) -> Image.Image | None:
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=8)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception:
        return None


def _basemap(zoom: int, left: float, top: float, width: int, height: int, url: str) -> Image.Image:
    img = Image.new("RGB", (width, height), BACKGROUND)
    n = 2 ** zoom
    tiles = [(tx, ty) for tx in range(int(left // TILE), int((left + width) // TILE) + 1)
             for ty in range(int(top // TILE), int((top + height) // TILE) + 1) if 0 <= ty < n]
    with ThreadPoolExecutor(max_workers=6) as pool:
        images = pool.map(lambda t: _fetch_tile(url.format(z=zoom, x=t[0] % n, y=t[1])), tiles)
        for (tx, ty), tile in zip(tiles, images):
            if tile is not None:
                img.paste(tile, (round(tx * TILE - left), round(ty * TILE - top)))
    return img


def _rgba(color: str, opacity: float) -> tuple[int, int, int, int]:
    color = color.lstrip("#")
    return (*(int(color[i:i + 2], 16) for i in (0, 2, 4)), round(255 * opacity))


def _dashed(draw, pts, fill, width, dash, gap):
    """Dashed polyline: walk the line, drawing `dash` pixels on and `gap` off."""
    on, left = True, dash
    for (x1, y1), (x2, y2) in zip(pts[:-1], pts[1:]):
        length = math.hypot(x2 - x1, y2 - y1)
        pos = 0.0
        while pos < length:
            step = min(left, length - pos)
            if on:
                a, b = pos / length, (pos + step) / length
                draw.line([(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a),
                           (x1 + (x2 - x1) * b, y1 + (y2 - y1) * b)], fill=fill, width=width)
            pos += step
            left -= step
            if left <= 0:
                on = not on
                left = dash if on else gap


def _font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10.1
        return ImageFont.load_default()


def route_png(result: dict, model, origin, destination, chosen: str = "fastest",
              width: int = 800, height: int = 520) -> bytes:
    """PNG bytes of the trip map shown on the Plan page."""
    fastest, safest = result["fastest"], result["safest"]
    alt = result["has_alternative"]
    pts = list(fastest.coords) + (list(safest.coords) if alt else []) + [tuple(origin), tuple(destination)]
    zoom = _fit_zoom(pts, width, height, pad=50)
    xs, ys = zip(*(_world_px(lat, lon, zoom) for lat, lon in pts))
    left = (min(xs) + max(xs)) / 2 - width / 2
    top = (min(ys) + max(ys)) / 2 - height / 2
    url, attribution = _tile_url()
    base = _basemap(zoom, left, top, width, height, url).convert("RGBA")

    def px(point):
        x, y = _world_px(point[0], point[1], zoom)
        return (x - left) * SCALE, (y - top) * SCALE

    overlay = Image.new("RGBA", (width * SCALE, height * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # fastest route, each step coloured by the history of its street segment
    w, opacity = (7, 0.95) if chosen == "fastest" else (4, 0.55)
    line = [px(p) for p in fastest.coords]
    for (a, b), r in zip(zip(line[:-1], line[1:]), fastest.segment_risk):
        draw.line([a, b], fill=_rgba(step_color(model, r), opacity), width=w * SCALE, joint="curve")
    if alt:
        line = [px(p) for p in safest.coords]
        if chosen == "safest":
            draw.line(line, fill=_rgba(SAFE_COLOR, 0.95), width=7 * SCALE, joint="curve")
        else:
            _dashed(draw, line, _rgba(SAFE_COLOR, 0.85), 4 * SCALE, 8 * SCALE, 8 * SCALE)

    # accident-risk warnings on the shown route
    shown = fastest if chosen == "fastest" else safest
    for _, row in shown.hotspots.head(25).iterrows():
        x, y = px((row["lat"], row["lon"]))
        s = 11 * SCALE
        tri = [(x, y - s), (x - s, y + s * 0.8), (x + s, y + s * 0.8)]
        draw.polygon(tri, fill=_rgba(RISK_COLORS.get(row["level"], RISK_COLORS["Medium"]), 1),
                     outline=(255, 255, 255, 255), width=2 * SCALE)
        draw.rectangle([x - SCALE, y - s * 0.45, x + SCALE, y + s * 0.2], fill="white")
        draw.rectangle([x - SCALE, y + s * 0.35, x + SCALE, y + s * 0.55], fill="white")

    # start (A) and destination (B)
    label_font = _font(13 * SCALE)
    for point, color, label in ((origin, "#38a169", "A"), (destination, "#e53e3e", "B")):
        x, y = px(point)
        r = 12 * SCALE
        draw.ellipse([x - r, y - r, x + r, y + r], fill=_rgba(color, 1), outline="white", width=3 * SCALE)
        draw.text((x, y), label, fill="white", font=label_font, anchor="mm")

    img = Image.alpha_composite(base, overlay.resize((width, height), Image.LANCZOS))
    _legend(img, model, alt, attribution)
    out = io.BytesIO()
    img.convert("RGB").save(out, "PNG", optimize=True)
    return out.getvalue()


def _legend(img: Image.Image, model, alt: bool, attribution: str) -> None:
    draw = ImageDraw.Draw(img, "RGBA")
    font, small = _font(12), _font(10)
    entries = [(FASTEST_COLOR, "No recorded accidents"), (RISK_COLORS["Low"], "Low history"),
               (RISK_COLORS["Medium"], "Medium history"), (RISK_COLORS["High"], "High history")]
    if alt:
        entries.append((SAFE_COLOR, "Safer alternative"))
    x0, y0 = 10, img.height - 12 - 18 * len(entries) - 8
    draw.rounded_rectangle([x0, y0, x0 + 160, img.height - 12], 6, fill=(255, 255, 255, 225),
                           outline=(0, 0, 0, 40))
    for i, (color, label) in enumerate(entries):
        y = y0 + 13 + 18 * i
        draw.line([(x0 + 10, y), (x0 + 34, y)], fill=color, width=5)
        draw.text((x0 + 42, y), label, fill=(40, 40, 40), font=font, anchor="lm")
    tw = draw.textlength(attribution, font=small)
    draw.rectangle([img.width - tw - 10, img.height - 16, img.width, img.height], fill=(255, 255, 255, 200))
    draw.text((img.width - 5, img.height - 3), attribution, fill=(60, 60, 60), font=small, anchor="rd")
