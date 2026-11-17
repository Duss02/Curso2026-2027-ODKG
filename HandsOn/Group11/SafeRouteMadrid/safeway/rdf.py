"""CSV -> RDF -> local triplestore.

For every CSV in data/raw/:
  1. clean + enrich        -> data/clean/<stem>.csv      (mapping input)
  2. RML mapping (morph-kgc) -> data/rdf/<stem>.nt        (RDF output, also the deliverable)
  3. load into Oxigraph    -> named graph <.../graph/data/<stem>>

A manifest (data/manifest.json) stores the hash of each processed file, so only new or changed
CSVs are processed and removed CSVs have their graph dropped. The ontology goes to its own graph.
"""
from __future__ import annotations

import hashlib
import json
import tempfile
import time
from pathlib import Path

import pyoxigraph as ox

from safeway import clean, config, enrich

NT = "application/n-triples"


def open_store(path: Path | None = None) -> ox.Store:
    path = path or config.STORE_DIR
    path.mkdir(parents=True, exist_ok=True)
    return ox.Store(str(path))


def graph_iri(stem: str) -> ox.NamedNode:
    return ox.NamedNode(config.DATA_GRAPH_PREFIX + stem)


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_manifest() -> dict:
    if config.MANIFEST.exists():
        return json.loads(config.MANIFEST.read_text(encoding="utf-8"))
    return {"files": {}}


def _write_manifest(manifest: dict) -> None:
    config.MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


def prepare(raw_csv: Path) -> Path:
    """Clean and enrich one raw CSV; returns the mapping-ready CSV."""
    df = clean.read_csv(raw_csv)
    df = clean.add_ids(clean.clean(df))
    df = enrich.add_links(enrich.add_coordinates(df))
    config.CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    out = config.CLEAN_DIR / f"{raw_csv.stem}.csv"
    df.to_csv(out, index=False, encoding="utf-8")
    return out


def materialize(clean_csv: Path) -> Path:
    """Run the RML mapping over one cleaned CSV with morph-kgc; returns the N-Triples file."""
    import morph_kgc

    source = clean_csv.resolve().as_posix()
    mapping = config.MAPPING.read_text(encoding="utf-8").replace("data/clean/SOURCE.csv", source)
    config.RDF_DIR.mkdir(parents=True, exist_ok=True)
    out = config.RDF_DIR / f"{clean_csv.stem}.nt"
    with tempfile.TemporaryDirectory() as tmp:
        mapping_file = Path(tmp) / "mapping.rml.ttl"
        mapping_file.write_text(mapping, encoding="utf-8")
        # empty cells are nulls -> no triple (same rule as the group's mapping comments)
        graph = morph_kgc.materialize_oxigraph(
            f"[CONFIGURATION]\nna_values=\nlogging_level=WARNING\n"
            f"[SafeRoute]\nmappings={mapping_file.as_posix()}\n")
        with open(out, "wb") as fh:
            graph.dump(fh, NT)
    return out


def load_ontology(store: ox.Store) -> None:
    g = ox.NamedNode(config.ONTOLOGY_GRAPH)
    store.clear_graph(g) if store.contains_named_graph(g) else None
    with open(config.ONTOLOGY, "rb") as fh:
        store.load(fh, "text/turtle", to_graph=g)


def load_graph(store: ox.Store, nt_file: Path, stem: str) -> None:
    g = graph_iri(stem)
    if store.contains_named_graph(g):
        store.remove_graph(g)
    with open(nt_file, "rb") as fh:
        store.bulk_load(fh, NT, to_graph=g)
    store.flush()


def ingest(store: ox.Store, force: bool = False, log=print) -> dict:
    """Bring the store in line with data/raw/. Returns a summary of what changed."""
    manifest = read_manifest()
    files = manifest.setdefault("files", {})
    raw = {p.stem: p for p in sorted(config.RAW_DIR.glob("*.csv"))}
    summary = {"added": [], "updated": [], "removed": [], "unchanged": [], "rejected": {}}

    for stem in sorted(set(files) - set(raw)):          # CSV deleted -> drop its graph
        g = graph_iri(stem)
        if store.contains_named_graph(g):
            store.remove_graph(g)
        for f in (config.CLEAN_DIR / f"{stem}.csv", config.RDF_DIR / f"{stem}.nt"):
            f.unlink(missing_ok=True)
        del files[stem]
        summary["removed"].append(stem)
        log(f"- {stem}: removed")

    for stem, path in raw.items():
        digest = _sha256(path)
        if not force and files.get(stem, {}).get("sha256") == digest \
                and store.contains_named_graph(graph_iri(stem)):
            summary["unchanged"].append(stem)
            continue
        start = time.time()
        try:
            log(f"+ {stem}: cleaning")
            clean_csv = prepare(path)
            log(f"+ {stem}: mapping to RDF")
            nt = materialize(clean_csv)
            log(f"+ {stem}: loading into the triplestore")
            load_graph(store, nt, stem)
        except clean.SchemaError as error:
            summary["rejected"][stem] = str(error)
            log(f"! {stem}: {error}")
            continue
        triples = sum(1 for _ in store.quads_for_pattern(None, None, None, graph_iri(stem)))
        summary["updated" if stem in files else "added"].append(stem)
        files[stem] = {"file": path.name, "sha256": digest, "triples": triples,
                       "loaded_at": time.strftime("%Y-%m-%d %H:%M:%S")}
        log(f"+ {stem}: {triples:,} triples in {time.time() - start:.0f} s")

    load_ontology(store)
    store.flush()
    _write_manifest(manifest)
    return summary
