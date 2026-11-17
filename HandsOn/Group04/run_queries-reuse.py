"""Run the queries of rdf/queries-reuse.sparql over the three Turtle files generated
with the EDINT ontologies and our own SKOS concepts (Group04 - HO6).

Usage, from the HandsOn/Group04 directory:
    python run_queries-reuse.py            # all queries
    python run_queries-reuse.py Q2 Q8      # only some of them

Loading the files takes about a minute (the air quality file has ~476k triples).
Q17 takes about a minute and a half.
"""
import re
import sys
import time
from pathlib import Path

from rdflib import Graph, Literal

# Show accents correctly in the Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

RDF_DIR = Path("rdf")
TTL_FILES = ["estaciones-control-aire-reuse.ttl",
             "instalaciones-deportivas-reuse.ttl",
             "calidad-aire-diario-2024-reuse.ttl"]
KOS_FILE = Path("ontology") / "breatheplay-kos.ttl"  # own SKOS concepts (ethylbenzene...)
MAX_ROWS = 39  # rows printed per query

def show(value):
    """Literals as plain text; IRIs shortened with the prefixes (bpm:, station:, ...)."""
    if value is None:
        return "-"
    if isinstance(value, Literal):
        return str(value)
    return value.n3(graph.namespace_manager)


# 1. Read the queries file: PREFIX lines + one block per query ("# Qn. title ... SELECT ...")
text = (RDF_DIR / "queries-reuse.sparql").read_text(encoding="utf-8")
prefixes = "\n".join(line for line in text.splitlines() if line.startswith("PREFIX"))
queries = []
for block in re.split(r"\n# -{10,}\n(?=# Q\d+\.)", text)[1:]:
    header, body = block.split("# " + "-" * 10, 1)
    qid, title = re.match(r"# (Q\d+)\.\s*(.*)", header).groups()
    body = body.split("\n", 1)[1]  # drop the rest of the dashed line
    queries.append((qid, title.strip(), body.strip()))

wanted = {a.upper() for a in sys.argv[1:]}
if wanted:
    queries = [q for q in queries if q[0] in wanted]

# 2. Load the three Turtle files into one graph
graph = Graph()
graph.bind("schema", "http://schema.org/", override=True, replace=True)
graph.bind("geo", "http://www.w3.org/2003/01/geo/wgs84_pos#", override=True, replace=True)
for name in TTL_FILES:
    start = time.time()
    graph.parse(RDF_DIR / name, format="turtle")
    print(f"Loaded {name} ({time.time() - start:.0f} s)")
graph.parse(KOS_FILE, format="turtle")
print(f"Loaded {KOS_FILE.name}")
print(f"Total: {len(graph):,} triples\n")

# 3. Run each query and print the first rows
for qid, title, body in queries:
    print("=" * 80)
    print(f"{qid}. {title}")
    print("=" * 80)
    start = time.time()
    result = graph.query(prefixes + "\n" + body)
    rows = list(result)
    print(f"{len(rows)} rows ({time.time() - start:.1f} s)")
    if rows:
        names = [str(v) for v in result.vars]
        print(" | ".join(names))
        for row in rows[:MAX_ROWS]:
            print(" | ".join(show(v) for v in row))
        if len(rows) > MAX_ROWS:
            print(f"... ({len(rows) - MAX_ROWS} more rows)")
    print()
