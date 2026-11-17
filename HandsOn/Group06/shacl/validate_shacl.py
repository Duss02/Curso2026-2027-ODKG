import sys
import time
import os

try:
    import pyshacl
    from rdflib import Graph
except ImportError:
    print("Error: 'pyshacl' and 'rdflib' are required to run this script.")
    print("Please install them using: pip install pyshacl rdflib")
    sys.exit(1)

# Dynamically resolve paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(script_dir, ".."))

default_data = os.path.join(project_dir, "rdf", "MyLA311_2025-with-links.ttl")
data_file = sys.argv[1] if len(sys.argv) > 1 else default_data
shapes_file = os.path.join(script_dir, "shapes.ttl")
report_file = os.path.join(script_dir, "report.ttl")

print(f"Loading data graph: {data_file}...")
t0 = time.time()
data_graph = Graph()
data_graph.parse(data_file, format="turtle")
print(f"Loaded {len(data_graph):,} data triples in {time.time() - t0:.2f}s.")

print(f"\nLoading SHACL shapes: {shapes_file}...")
shapes_graph = Graph()
shapes_graph.parse(shapes_file, format="turtle")
print(f"Loaded {len(shapes_graph):,} shape triples.")

print("\nRunning SHACL validation with pyshacl...")
t1 = time.time()
conforms, v_graph, v_text = pyshacl.validate(
    data_graph,
    shacl_graph=shapes_graph,
    inference="rdfs",
    abort_on_first=False,
    allow_infos=True,
    allow_warnings=True,
    meta_shacl=False,
    advanced=False,
    js=False,
    debug=False
)
elapsed = time.time() - t1
print(f"Validation completed in {elapsed:.2f} seconds.")

print(f"\nValidation Result: {'CONFORMS' if conforms else 'VIOLATIONS FOUND'}")
print(v_text)

# Save the validation report in Turtle syntax
print(f"\nSaving validation report to {report_file}...")
if hasattr(v_graph, "serialize"):
    v_graph.serialize(report_file, format="turtle")
else:
    with open(report_file, "w") as f:
        f.write(v_graph)

print(f"Successfully generated {report_file}!")
