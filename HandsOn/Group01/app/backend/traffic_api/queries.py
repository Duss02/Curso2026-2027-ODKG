"""Read-only SPARQL. Shared filter patterns keep pages and totals consistent."""

import json
import re
from datetime import timedelta

from .models import AccidentFilters

ACCIDENT_PREFIX = "http://group01.opendata.upm.es/resource/accidents/"
CELL_SIZE = 0.005
MAX_HOTSPOT_CELLS = 2000

PREFIXES = """PREFIX ao: <http://group01.opendata.upm.es/ontology/accidents#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX schema: <https://schema.org/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
"""

HEALTH = "SELECT (1 AS ?ok) WHERE {}"

CORE = """
    ?accident rdf:type ao:TrafficAccident ;
              ao:latitude ?latitude ; ao:longitude ?longitude ;
              ao:severity ?severity ; ao:startTime ?startTime .
"""


def literal(value: str) -> str:
    # Escape quotes, backslashes and controls; preserve Unicode literally.
    return json.dumps(value, ensure_ascii=False)


def filter_pattern(filters: AccidentFilters) -> str:
    conditions = []
    if filters.severities:
        levels = ", ".join(str(level) for level in sorted(set(filters.severities)))
        conditions.append(f"FILTER (?severity IN ({levels}))")
    if filters.start_date:
        conditions.append(f'FILTER (?startTime >= "{filters.start_date.isoformat()}T00:00:00"^^xsd:dateTime)')
    if filters.end_date:
        # Inclusive calendar day, including fractional seconds before midnight.
        next_day = filters.end_date + timedelta(days=1)
        conditions.append(f'FILTER (?startTime < "{next_day.isoformat()}T00:00:00"^^xsd:dateTime)')
    if filters.street and filters.street.strip():
        search = literal(filters.street.strip())
        # EXISTS avoids duplicate rows and preserves OPTIONAL display names.
        conditions.append(f"""FILTER EXISTS {{
          ?accident ao:locatedOn ?searchStreet .
          ?searchStreet ao:streetName ?searchName .
          FILTER(CONTAINS(LCASE(STR(?searchName)), LCASE({search})))
        }}""")
    return "\n".join(conditions)


def severity_query(filters: AccidentFilters) -> str:
    return PREFIXES + """
SELECT ?severity (COUNT(DISTINCT ?accident) AS ?count)
WHERE {
""" + CORE + filter_pattern(filters) + "\n}\nGROUP BY ?severity\nORDER BY ?severity\n"


def accidents_query(limit: int, offset: int, filters: AccidentFilters | None = None) -> str:
    if type(limit) is not int or not 1 <= limit <= 1000:
        raise ValueError("limit must be an integer between 1 and 1000")
    if type(offset) is not int or not 0 <= offset <= 1_000_000:
        raise ValueError("offset must be an integer between 0 and 1000000")
    # Page core records before joining street labels, rather than grouping all
    # 21,699 street joins to return a small page. The outer order is also stable.
    return PREFIXES + """
SELECT ?accident ?latitude ?longitude ?severity ?startTime
       (MIN(?name) AS ?streetName)
WHERE {
  {
    SELECT DISTINCT ?accident ?latitude ?longitude ?severity ?startTime WHERE {
""" + CORE + filter_pattern(filters or AccidentFilters()) + """
    }
    ORDER BY STR(?accident) ?latitude ?longitude ?severity ?startTime
""" + f"LIMIT {limit}\nOFFSET {offset}\n" + """
  }
    OPTIONAL { ?accident ao:locatedOn ?street . ?street ao:streetName ?name . }
}
GROUP BY ?accident ?latitude ?longitude ?severity ?startTime
ORDER BY STR(?accident) ?latitude ?longitude ?severity ?startTime
"""


def hotspots_query(filters: AccidentFilters) -> str:
    # Fixed geographic bins, anchored at 0 degrees. Negative longitudes use
    # FLOOR (not truncation toward zero). One sentinel row detects overflow;
    # oversized results fail explicitly rather than silently losing cells.
    return PREFIXES + """
SELECT ?latBin ?lngBin (COUNT(DISTINCT ?accident) AS ?count)
WHERE {
""" + CORE + filter_pattern(filters) + f"""
    BIND(FLOOR(?latitude / {CELL_SIZE}) AS ?latBin)
    BIND(FLOOR(?longitude / {CELL_SIZE}) AS ?lngBin)
}}
GROUP BY ?latBin ?lngBin
ORDER BY ?latBin ?lngBin
LIMIT {MAX_HOTSPOT_CELLS + 1}
"""


METADATA = PREFIXES + """
SELECT (MIN(?startTime) AS ?firstTime) (MAX(?startTime) AS ?lastTime)
       (MIN(?latitude) AS ?south) (MAX(?latitude) AS ?north)
       (MIN(?longitude) AS ?west) (MAX(?longitude) AS ?east)
WHERE {
""" + CORE + "\n}\n"


def detail_query(accident_id: str) -> str:
    if not re.fullmatch(r"A-[A-Za-z0-9-]{1,80}", accident_id):
        raise ValueError("Invalid accident ID")
    return PREFIXES + f"""
SELECT ?accident ?latitude ?longitude ?severity ?startTime
       (MIN(?end) AS ?endTime) (MIN(?text) AS ?description)
       (SAMPLE(?signal) AS ?trafficSignal)
       (MIN(?road) AS ?streetUri) (MIN(?name) AS ?streetName)
       (MIN(?wikidata) AS ?streetWikidataUri)
       (MIN(?cityLabel) AS ?city) (MIN(?stateLabel) AS ?state) (MIN(?countryLabel) AS ?country)
WHERE {{
    VALUES ?accident {{ <{ACCIDENT_PREFIX}{accident_id}> }}
""" + CORE + """
    OPTIONAL { ?accident ao:endTime ?end . }
    OPTIONAL { ?accident ao:description ?text . }
    OPTIONAL { ?accident ao:hasTrafficSignal ?signal . }
    OPTIONAL {
      ?accident ao:locatedOn ?road .
      OPTIONAL { ?road ao:streetName ?name . }
      OPTIONAL {
        ?road owl:sameAs ?wikidata .
        FILTER(isIRI(?wikidata) && REGEX(STR(?wikidata), "^https?://www[.]wikidata[.]org/entity/Q[1-9][0-9]*$"))
      }
    }
    OPTIONAL {
      ?accident schema:location ?cityResource .
      OPTIONAL { ?cityResource schema:name ?cityLabel . }
      OPTIONAL {
        ?cityResource schema:containedInPlace ?stateResource .
        OPTIONAL { ?stateResource schema:name ?stateLabel . }
        OPTIONAL {
          ?stateResource schema:containedInPlace ?countryResource .
          OPTIONAL { ?countryResource schema:name ?countryLabel . }
        }
      }
    }
}
GROUP BY ?accident ?latitude ?longitude ?severity ?startTime
LIMIT 1
"""
