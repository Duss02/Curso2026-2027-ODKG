"""Create the GraphDB repository "db-delays" and load the ontology and knowledge graph.

Runs once as the `graphdb-init` service in docker-compose.yml (after GraphDB is healthy).
- Repository missing          -> create it, then upload the data.
- Repository exists but empty -> upload the data.
- Repository exists with data -> do nothing (run `docker compose down -v` to reload).

Uses only the Python standard library, so it runs on a plain python:*-slim image.
"""

import sys
import time
import urllib.error
import urllib.request
import uuid

GRAPHDB_URL = "http://graphdb:7200"
REPO_ID = "db-delays"
DATA_FILES = [
    "/init/ontology.ttl",
    "/init/knowledge-graph.ttl",
]

# RDFS inference without owl:sameAs reasoning: sameAs would merge our resources with
# their Wikidata counterparts and duplicate rows / inflate counts in the app queries.
REPO_CONFIG = f"""
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix rep: <http://www.openrdf.org/config/repository#> .
@prefix sr: <http://www.openrdf.org/config/repository/sail#> .
@prefix sail: <http://www.openrdf.org/config/sail#> .
@prefix graphdb: <http://www.ontotext.com/config/graphdb#> .

[] a rep:Repository ;
    rep:repositoryID "{REPO_ID}" ;
    rdfs:label "Deutsche Bahn delays knowledge graph" ;
    rep:repositoryImpl [
        rep:repositoryType "graphdb:SailRepository" ;
        sr:sailImpl [
            sail:sailType "graphdb:Sail" ;
            graphdb:ruleset "rdfsplus-optimized" ;
            graphdb:disable-sameAs "true"
        ]
    ] .
"""


def request(method, path, data=None, headers=None):
    req = urllib.request.Request(GRAPHDB_URL + path, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.status, resp.read().decode("utf-8")


def wait_for_graphdb(timeout=120):
    deadline = time.time() + timeout
    while True:
        try:
            request("GET", "/rest/repositories")
            return
        except (urllib.error.URLError, ConnectionError):
            if time.time() > deadline:
                sys.exit(f"GraphDB not reachable at {GRAPHDB_URL}")
            time.sleep(2)


def repository_exists():
    try:
        request("GET", f"/rest/repositories/{REPO_ID}")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return False
        raise


def create_repository():
    # The REST API expects the config as a multipart file upload in the field "config".
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="config"; filename="config.ttl"\r\n'
        "Content-Type: text/turtle\r\n\r\n"
        f"{REPO_CONFIG}\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")
    request("POST", "/rest/repositories", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})


def repository_size():
    _, text = request("GET", f"/repositories/{REPO_ID}/size")
    return int(text.strip())


def upload(path):
    with open(path, "rb") as f:
        data = f.read()
    request("POST", f"/repositories/{REPO_ID}/statements", data, {"Content-Type": "text/turtle"})


def main():
    wait_for_graphdb()

    if repository_exists():
        size = repository_size()
        if size > 0:
            print(f"Repository '{REPO_ID}' already contains {size} statements, nothing to do.")
            return
        print(f"Repository '{REPO_ID}' exists but is empty.")
    else:
        print(f"Creating repository '{REPO_ID}'...")
        create_repository()

    for path in DATA_FILES:
        print(f"Uploading {path}...")
        upload(path)

    print(f"Done: repository '{REPO_ID}' contains {repository_size()} statements.")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        sys.exit(f"GraphDB request failed: {e.code} {e.reason}\n{e.read().decode('utf-8', 'replace')}")
