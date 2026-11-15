"""Enrichment of cleaned accident rows: WGS84 coordinates and Wikidata links.

Coordinates: the Madrid files use ETRS89 / UTM 30N (EPSG:25830). The group's OpenRefine formula
had a central-meridian bug (+6 degrees, patched later by `value - 6` in LOD-Refine); pyproj does the
exact conversion instead.

Wikidata: LOD-Refine reconciled four columns against wikidata.reconci.link. Those decisions are
kept in data/links/wikidata_lookup.csv (column, value, uri), so new CSVs get the same links
offline. Values never reconciled stay without owl:sameAs.
"""
from __future__ import annotations

from functools import lru_cache

import pandas as pd
from pyproj import Transformer

from safeway import config

# CSV column -> column holding its Wikidata IRI (names used by the RML mapping)
LINK_COLUMNS = {
    "distrito": "same_as_wikidata_district",
    "tipo_accidente": "same_as_wikidata_type_accident",
    "tipo_vehiculo": "same_as_wikidata_vehicle",
    "tipo_persona": "same_as_wikidata_type_person",
}


@lru_cache(maxsize=1)
def _transformer() -> Transformer:
    return Transformer.from_crs(f"EPSG:{config.UTM_EPSG}", "EPSG:4326", always_xy=True)


def add_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    x = pd.to_numeric(df["coordenada_x_utm"], errors="coerce")
    y = pd.to_numeric(df["coordenada_y_utm"], errors="coerce")
    lon, lat = _transformer().transform(x.to_numpy(), y.to_numpy())
    lon, lat = pd.Series(lon, index=df.index).round(6), pd.Series(lat, index=df.index).round(6)
    b = config.MADRID_BBOX
    inside = lon.between(b["west"], b["east"]) & lat.between(b["south"], b["north"])
    df["longitud"] = lon.where(inside).map(_fmt)
    df["latitud"] = lat.where(inside).map(_fmt)
    return df


def _fmt(value: float) -> str:
    """6 decimals without trailing zeros, as OpenRefine's round(v * 1e6) / 1e6 prints them."""
    return "" if pd.isna(value) else f"{value:.6f}".rstrip("0").rstrip(".")


@lru_cache(maxsize=1)
def wikidata_lookup() -> dict[tuple[str, str], str]:
    if not config.WIKIDATA_LOOKUP.exists():
        return {}
    table = pd.read_csv(config.WIKIDATA_LOOKUP, dtype=str, keep_default_na=False)
    return {(r.column, r.value): r.uri for r in table.itertuples()}


def add_links(df: pd.DataFrame) -> pd.DataFrame:
    lookup = wikidata_lookup()
    for column, link_column in LINK_COLUMNS.items():
        df[link_column] = df[column].map(lambda v, c=column: lookup.get((c, v), ""))
    return df
