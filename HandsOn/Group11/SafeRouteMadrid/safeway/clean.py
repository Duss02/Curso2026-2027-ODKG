"""Cleaning of Madrid traffic-accident CSVs: the group's OpenRefine history, in Python.

Source of truth: data/reference/history.json (53 operations) and history-with-links.json
(LOD-Refine). Every rule below cites the operation it reproduces. Rules are idempotent, so the
input can be the raw portal file (';', dd/mm/yyyy, S/N) or an already cleaned file (',', ISO,
true/false). Empty cell = null: the RML mapping then generates no triple for it.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

import pandas as pd

from safeway import config


class SchemaError(ValueError):
    """The CSV is not a Madrid traffic-accident file."""


def read_csv(path: Path) -> pd.DataFrame:
    """Read a raw or cleaned accident CSV, detecting encoding and delimiter."""
    raw = Path(path).read_bytes()
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    header = text.split("\n", 1)[0]
    sep = ";" if header.count(";") > header.count(",") else ","
    from io import StringIO
    df = pd.read_csv(StringIO(text), sep=sep, dtype=str, keep_default_na=False, quoting=csv.QUOTE_MINIMAL)
    df.columns = [c.strip() for c in df.columns]
    missing = [c for c in config.REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise SchemaError(f"{Path(path).name}: missing columns {missing}. SafeRoute Madrid accepts the Madrid "
                          "open-data traffic accident files (any year).")
    return df[config.REQUIRED_COLUMNS].copy()


_DMY = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")


def _date(value: str) -> str:
    """op 0: dd/mm/yyyy -> yyyy-mm-dd (ISO values pass through)."""
    m = _DMY.match(value)
    return f"{m[3]}-{int(m[2]):02d}-{int(m[1]):02d}" if m else value


def _time(value: str) -> str:
    """op 1: H:MM:SS -> HH:MM:SS."""
    return "0" + value if len(value) == 7 else value


def _number(value: str) -> str:
    """ops 6-9: decimal comma -> dot, 0 -> null."""
    if not value:
        return ""
    try:
        number = float(value.replace(",", "."))
    except ValueError:
        return ""
    return "" if number == 0 else repr(number).removesuffix(".0") if number.is_integer() else repr(number)


def _alcohol(value: str) -> str:
    """op 15 + op 52: S -> true, N -> false, blank/unknown -> null."""
    v = value.strip().upper()
    return {"S": "true", "N": "false", "TRUE": "true", "FALSE": "false"}.get(v, "")


def _drug(value: str) -> str:
    """op 16 + op 49: 1 -> true, blank/unknown -> false."""
    v = value.strip().lower()
    return "true" if v in ("1", "true") else "false"


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.apply(lambda col: col.str.strip())                    # ops 2-3 (trim), applied to all
    df["fecha"] = df["fecha"].map(_date)
    df["hora"] = df["hora"].map(_time)
    for col in ("coordenada_x_utm", "coordenada_y_utm"):
        df[col] = df[col].map(_number)

    nulls = {                                                     # value(s) that mean "unknown"
        "estado_meteorológico": {"Se desconoce", "se desconoce", "Desconocido"},   # ops 4,5,20,42
        "tipo_vehiculo": {"Desconocido", "Sin especificar"},                       # ops 19,43
        "tipo_accidente": {"Desconocido", "Otro"},                                 # op 51, LOD op 40
        "rango_edad": {"Desconocido"},                                             # op 45
        "sexo": {"Desconocido"},                                                   # op 46
        "cod_lesividad": {"Desconocido"},                                          # op 47
        "lesividad": {"Desconocido"},                                              # op 48
        "localizacion": {"."},                                                     # op 50
    }
    for col, values in nulls.items():
        df.loc[df[col].isin(values), col] = ""
    df.loc[df["tipo_persona"] == "Peatón (atropello sc)", "tipo_persona"] = "Peatón"   # op 44
    df["positiva_alcohol"] = df["positiva_alcohol"].map(_alcohol)
    df["positiva_droga"] = df["positiva_droga"].map(_drug)
    df = df[df["num_expediente"] != ""].reset_index(drop=True)
    return df


def add_ids(df: pd.DataFrame) -> pd.DataFrame:
    """ops 10-14: person and vehicle identifiers inside each accident record.

    ID_persona = {num_expediente}-P{n}, n = position of the row in its accident (1-based).
    ID_vehiculo = {num_expediente}-V{k}, k = number of 'Conductor' rows up to this one; empty if no
    driver has appeared yet (OpenRefine's `filter(slice(...), v == "Conductor").length()`).
    """
    group = df.groupby("num_expediente", sort=False)
    position = group.cumcount() + 1
    drivers = (df["tipo_persona"] == "Conductor").astype(int).groupby(df["num_expediente"], sort=False).cumsum()
    df["ID_persona"] = df["num_expediente"] + "-P" + position.astype(str)
    df["ID_vehiculo"] = (df["num_expediente"] + "-V" + drivers.astype(str)).where(drivers > 0, "")
    return df
