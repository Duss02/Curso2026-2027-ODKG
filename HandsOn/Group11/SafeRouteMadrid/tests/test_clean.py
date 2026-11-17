import pandas as pd
import pytest

from safeway import clean, enrich


def prepared(path):
    df = clean.add_ids(clean.clean(clean.read_csv(path)))
    return enrich.add_links(enrich.add_coordinates(df))


def test_formats_dates_times_and_numbers(raw_csv):
    df = prepared(raw_csv)
    assert df.loc[0, "fecha"] == "2026-01-01"
    assert df.loc[3, "fecha"] == "2026-03-15"
    assert df.loc[0, "hora"] == "03:00:00"
    assert df.loc[0, "coordenada_x_utm"] == "442386.41"
    assert df.loc[0, "distrito"] == "SALAMANCA"          # trimmed


def test_unknowns_become_null(raw_csv):
    df = prepared(raw_csv)
    pedestrian = df.loc[3]
    assert pedestrian["estado_meteorológico"] == ""      # "Se desconoce"
    assert pedestrian["tipo_vehiculo"] == ""             # "Sin especificar"
    assert pedestrian["localizacion"] == ""              # "."
    assert pedestrian["coordenada_x_utm"] == ""          # 0
    assert pedestrian["tipo_persona"] == "Peatón"        # "Peatón (atropello sc)"
    assert df.loc[2, "rango_edad"] == "" and df.loc[2, "sexo"] == ""


def test_booleans(raw_csv):
    df = prepared(raw_csv)
    assert list(df["positiva_alcohol"]) == ["", "false", "true", ""]
    assert list(df["positiva_droga"]) == ["false", "false", "true", "false"]


def test_person_and_vehicle_ids(raw_csv):
    df = prepared(raw_csv)
    assert list(df["ID_persona"]) == ["2026S000001-P1", "2026S000001-P2", "2026S000001-P3", "2026S000002-P1"]
    # a passenger before any driver has no vehicle; each driver opens a new vehicle
    assert list(df["ID_vehiculo"]) == ["", "2026S000001-V1", "2026S000001-V2", ""]


def test_coordinates_are_in_madrid(raw_csv):
    df = prepared(raw_csv)
    lat, lon = float(df.loc[0, "latitud"]), float(df.loc[0, "longitud"])
    assert lat == pytest.approx(40.424901, abs=1e-5)      # value in the group's with-links CSV
    assert lon == pytest.approx(-3.679177, abs=1e-5)
    assert df.loc[3, "latitud"] == ""                       # no coordinates -> no point


def test_wikidata_links(raw_csv):
    df = prepared(raw_csv)
    assert df.loc[0, "same_as_wikidata_district"] == "https://www.wikidata.org/entity/Q1773521"
    assert df.loc[1, "same_as_wikidata_vehicle"] == "https://www.wikidata.org/entity/Q1420"
    assert df.loc[3, "same_as_wikidata_vehicle"] == ""


def test_cleaning_is_idempotent(raw_csv, tmp_path):
    once = prepared(raw_csv)
    path = tmp_path / "cleaned.csv"
    once.to_csv(path, index=False)
    twice = prepared(path)
    pd.testing.assert_frame_equal(once, twice)


def test_rejects_other_csvs(tmp_path):
    path = tmp_path / "other.csv"
    path.write_text("a,b\n1,2\n", encoding="utf-8")
    with pytest.raises(clean.SchemaError):
        clean.read_csv(path)
