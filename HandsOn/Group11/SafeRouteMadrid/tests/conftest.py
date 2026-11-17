import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

HEADER = ("num_expediente;fecha;hora;localizacion;numero;cod_distrito;distrito;tipo_accidente;"
          "estado_meteorológico;tipo_vehiculo;tipo_persona;rango_edad;sexo;cod_lesividad;lesividad;"
          "coordenada_x_utm;coordenada_y_utm;positiva_alcohol;positiva_droga")

# Raw portal format: ';', dd/mm/yyyy, H:MM:SS, decimal comma, S/N, blanks.
# Accident A: passenger before the first driver, then two drivers. Accident B: pedestrian run over.
RAW_ROWS = [
    "2026S000001;01/01/2026;3:00:00;CALL. GOYA, 46;46;4;SALAMANCA ;Colisión lateral;Despejado;Turismo;Pasajero;De 21 a 24 años;Mujer;;;442386,41;4475140,23;;",
    "2026S000001;01/01/2026;3:00:00;CALL. GOYA, 46;46;4;SALAMANCA ;Colisión lateral;Despejado;Turismo;Conductor;De 30 a 34 años;Hombre;14;Sin asistencia sanitaria;442386,41;4475140,23;N;",
    "2026S000001;01/01/2026;3:00:00;CALL. GOYA, 46;46;4;SALAMANCA ;Colisión lateral;Despejado;Motocicleta > 125cc;Conductor;Desconocido;Desconocido;3;Ingreso superior a 24 horas;442386,41;4475140,23;S;1",
    "2026S000002;15/03/2026;18:45:00;.;0;1;CENTRO;Atropello a persona;Se desconoce;Sin especificar;Peatón (atropello sc);De 65 a 69 años;Mujer;4;Fallecido 24 horas;0;0;;",
]


@pytest.fixture
def raw_csv(tmp_path):
    path = tmp_path / "sample_2026.csv"
    path.write_text(HEADER + "\n" + "\n".join(RAW_ROWS) + "\n", encoding="utf-8-sig")
    return path


@pytest.fixture
def isolated_data(tmp_path, monkeypatch):
    """Point every data path of safeway.config at a temporary folder."""
    from safeway import config

    data = tmp_path / "data"
    for name, sub in [("RAW_DIR", "raw"), ("CLEAN_DIR", "clean"), ("RDF_DIR", "rdf"),
                      ("STORE_DIR", "store"), ("PROCESSED_DIR", "processed")]:
        monkeypatch.setattr(config, name, data / sub)
    monkeypatch.setattr(config, "MANIFEST", data / "manifest.json")
    (data / "raw").mkdir(parents=True)
    return data
