"""Extract the group's LOD-Refine Wikidata reconciliation into data/links/wikidata_lookup.csv.

    python scripts/build_wikidata_lookup.py

Reads the *-with-links.csv files in data/reference/ (LOD-Refine output) and keeps one IRI per
(column, value). Run it again only if the reconciliation changes; the lookup is committed.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from safeway import config  # noqa: E402
from safeway.enrich import LINK_COLUMNS  # noqa: E402


def main() -> None:
    files = sorted((config.DATA / "reference").glob("*-with-links.csv"))
    if not files:
        sys.exit("No data/reference/*-with-links.csv files found")
    rows = []
    for f in files:
        df = pd.read_csv(f, dtype=str, keep_default_na=False)
        for column, link in LINK_COLUMNS.items():
            pairs = df.loc[df[link] != "", [column, link]].drop_duplicates()
            rows += [(column, v.strip(), uri.strip()) for v, uri in pairs.itertuples(index=False)]
    table = pd.DataFrame(rows, columns=["column", "value", "uri"]).drop_duplicates()
    conflicts = table[table.duplicated(["column", "value"], keep=False)]
    if not conflicts.empty:
        print("Values with more than one IRI (first kept):\n", conflicts.to_string(index=False))
    table = table.drop_duplicates(["column", "value"]).sort_values(["column", "value"])
    config.WIKIDATA_LOOKUP.parent.mkdir(parents=True, exist_ok=True)
    table.to_csv(config.WIKIDATA_LOOKUP, index=False)
    print(f"{len(table)} links -> {config.WIKIDATA_LOOKUP.relative_to(config.ROOT)}")


if __name__ == "__main__":
    main()
