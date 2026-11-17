import shutil

import pyoxigraph as ox

from safeway import config, queries, rdf

R = config.RES
NS = config.NS


def triples(nt_path):
    return {str(t) for t in ox.parse(str(nt_path), "application/n-triples")}


def test_mapping_output(raw_csv, isolated_data):
    nt = rdf.materialize(rdf.prepare(raw_csv))
    t = triples(nt)
    assert f"<{R}TrafficAccident/2026S000001> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{NS}TrafficAccident>" in t
    # the location points to the district by code, and that district exists (YARRRML bug avoided)
    assert f"<{R}Location/2026S000001> <{NS}locatedIn> <{R}District/4>" in t
    assert f"<{R}District/4> <http://www.w3.org/2002/07/owl#sameAs> <https://www.wikidata.org/entity/Q1773521>" in t
    assert f'<{R}Point/2026S000001> <{NS}longitude> "-3.679177"^^<http://www.w3.org/2001/XMLSchema#double>' in t
    assert f'<{R}Person/2026S000001-P3> <{NS}positiveAlcohol> "true"^^<http://www.w3.org/2001/XMLSchema#boolean>' in t
    # nulls produce no triples (the Point itself still gets its type and label, as in the group's RDF)
    assert not any(s.startswith(f"<{R}Point/2026S000002> <{NS}latitude>") for s in t)
    assert not any(s.startswith(f"<{R}TrafficAccident/2026S000002> <{NS}hasWeatherCondition>") for s in t)


def test_ingest_is_incremental_and_removes_graphs(raw_csv, isolated_data):
    shutil.copy(raw_csv, config.RAW_DIR / "a.csv")
    store = rdf.open_store()
    first = rdf.ingest(store, log=lambda *_: None)
    assert first["added"] == ["a"]
    assert rdf.ingest(store, log=lambda *_: None)["unchanged"] == ["a"]

    shutil.copy(raw_csv, config.RAW_DIR / "b.csv")            # the same data added twice
    rdf.ingest(store, log=lambda *_: None)
    assert queries.duplicate_accidents(store) == 2

    (config.RAW_DIR / "b.csv").unlink()
    assert rdf.ingest(store, log=lambda *_: None)["removed"] == ["b"]
    assert queries.duplicate_accidents(store) == 0
    assert not store.contains_named_graph(rdf.graph_iri("b"))


def test_rejected_file_is_reported(isolated_data):
    (config.RAW_DIR / "bad.csv").write_text("x;y\n1;2\n", encoding="utf-8")
    summary = rdf.ingest(rdf.open_store(), log=lambda *_: None)
    assert "bad" in summary["rejected"]


def test_accidents_query(raw_csv, isolated_data):
    shutil.copy(raw_csv, config.RAW_DIR / "a.csv")
    store = rdf.open_store()
    rdf.ingest(store, log=lambda *_: None)
    df = queries.accidents(store)
    assert list(df["id"]) == ["2026S000001"]                 # 000002 has no coordinates
    row = df.iloc[0]
    assert sorted(row["vehicleTypes"]) == ["Motocicleta > 125cc", "Turismo"]
    assert sorted(row["severityCodes"]) == ["14", "3"]
    assert row["district"] == "SALAMANCA"
