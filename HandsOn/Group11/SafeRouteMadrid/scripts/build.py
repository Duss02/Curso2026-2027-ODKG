"""Build everything the app reads.

    python scripts/build.py            # ingest new/changed CSVs, then rebuild risk
    python scripts/build.py --force    # re-process every CSV
    python scripts/build.py --skip-ingest

Steps: data/raw/*.csv -> RDF -> triplestore (safeway.rdf) -> SPARQL accidents -> street networks
(downloaded once) -> risk per segment -> data/processed/. Close the app first: the triplestore
can only be opened by one process at a time.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from safeway import pipeline  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="re-process every CSV")
    parser.add_argument("--skip-ingest", action="store_true", help="only rebuild the risk model")
    args = parser.parse_args()
    start = time.time()
    pipeline.build(force=args.force, skip_ingest=args.skip_ingest)
    print(f"Done in {time.time() - start:.0f} s. Start the app with: streamlit run app.py")


if __name__ == "__main__":
    main()
