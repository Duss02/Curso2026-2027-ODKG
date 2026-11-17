"""SPARQL queries of the app (over the Hands-on 6 graph, EDINT vocabulary)."""
RES = "https://w3id.org/breatheplay-madrid/resource/"

PREFIXES = """
PREFIX bpm:      <https://w3id.org/breatheplay-madrid/ontology#>
PREFIX bpmkos:   <https://w3id.org/breatheplay-madrid/kos/>
PREFIX edintmed: <https://edint.es/def/medio-ambiente#>
PREFIX edintinf: <https://edint.es/def/infraestructura#>
PREFIX esadm:    <http://vocab.linkeddata.es/datosabiertos/def/sector-publico/territorio#>
PREFIX sosa:     <http://www.w3.org/ns/sosa/>
PREFIX time:     <http://www.w3.org/2006/time#>
PREFIX geo:      <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX schema:   <http://schema.org/>
PREFIX skos:     <http://www.w3.org/2004/02/skos/core#>
PREFIX dct:      <http://purl.org/dc/terms/>
PREFIX owl:      <http://www.w3.org/2002/07/owl#>
PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#>
"""

# Reference values for the daily mean (WHO Air Quality Guidelines 2021, 24-hour
# values; for O3 the guideline is an 8-hour mean, used here as an approximation).
# Daily mean <= reference: "Bueno"; <= 2 x reference: "Moderado"; above: "Malo".
# Key: readable name of the Madrid pollutant concept (resource/pollutant/...).
REFERENCE = {
    "no2": 25,
    "pm10": 45,
    "pm2-5": 15,
    "o3": 100,
    "so2": 40,
    "co": 4,  # mg/m3
}


def pollutants():
    """Madrid pollutant codes with a reference value, and their EDINT property."""
    values = " ".join(f"<{RES}pollutant/{slug}>" for slug in REFERENCE)
    return PREFIXES + f"""
SELECT ?pollutant ?name ?code ?property ?wikidata
WHERE {{
  VALUES ?pollutant {{ {values} }}
  ?pollutant skos:prefLabel ?name ;
             skos:notation ?code ;
             skos:exactMatch ?property .
  OPTIONAL {{ ?pollutant skos:relatedMatch ?wikidata }}
}}
"""


def date_range():
    return PREFIXES + """
SELECT (MIN(?date) AS ?first) (MAX(?date) AS ?last)
WHERE { ?day a time:Interval ; time:hasBeginning/time:inXSDDate ?date . }
"""


def facilities():
    """All facilities with their location, nearest station and Madrid types."""
    return PREFIXES + """
SELECT ?facility ?name ?lat ?long ?district ?neighbourhood ?accessibility
       ?station ?stationName ?distance
       (GROUP_CONCAT(DISTINCT ?typeName; separator=" | ") AS ?types)
WHERE {
  ?facility a edintinf:Facility ;
            rdfs:label ?name ;
            geo:lat ?lat ;
            geo:long ?long ;
            bpm:hasNearestStation ?station ;
            bpm:distanceToNearestStation ?distance .
  ?station rdfs:label ?stationName .
  OPTIONAL { ?facility edintinf:accessibility ?accessibility }
  OPTIONAL { ?facility edintinf:belongsTo ?d . ?d a esadm:Distrito ; rdfs:label ?district }
  OPTIONAL { ?facility edintinf:belongsTo ?n . ?n a esadm:Barrio ; rdfs:label ?neighbourhood }
  OPTIONAL { ?facility edintinf:hasInfrastructureType ?t .
             ?t skos:inScheme bpmkos:MadridFacilityTypes ; skos:prefLabel ?typeName }
}
GROUP BY ?facility ?name ?lat ?long ?district ?neighbourhood ?accessibility
         ?station ?stationName ?distance
"""


def facility_types():
    return PREFIXES + """
SELECT ?type ?name (COUNT(?facility) AS ?facilities)
WHERE {
  ?type skos:inScheme bpmkos:MadridFacilityTypes ; skos:prefLabel ?name .
  ?facility edintinf:hasInfrastructureType ?type .
}
GROUP BY ?type ?name
ORDER BY ?name
"""


def stations():
    return PREFIXES + """
SELECT ?station ?name ?lat ?long ?stationType
WHERE {
  ?station a edintmed:SensorPlatform ;
           rdfs:label ?name ;
           geo:lat ?lat ;
           geo:long ?long .
  OPTIONAL { ?station bpm:hasStationType/rdfs:label ?stationType }
}
"""


def values_on_day(prop, date):
    """Daily value of a property at every station on one day."""
    return PREFIXES + f"""
SELECT ?station ?value ?valid
WHERE {{
  ?obs sosa:phenomenonTime <{RES}day/{date}> ;
       sosa:observedProperty <{prop}> ;
       sosa:madeBySensor/sosa:isHostedBy ?station ;
       sosa:hasSimpleResult ?value ;
       bpm:isValid ?valid .
}}
"""


def facility_details(facility):
    return PREFIXES + f"""
SELECT ?name ?street ?postalCode ?district ?districtWikidata ?neighbourhood
       ?neighbourhoodWikidata ?accessibility ?equipment ?transport ?url
       ?station ?stationName ?stationType ?distance
       (GROUP_CONCAT(DISTINCT ?typeName; separator=" | ") AS ?types)
WHERE {{
  <{facility}> rdfs:label ?name ;
               bpm:hasNearestStation ?station ;
               bpm:distanceToNearestStation ?distance .
  ?station rdfs:label ?stationName .
  OPTIONAL {{ ?station bpm:hasStationType/rdfs:label ?stationType }}
  OPTIONAL {{ <{facility}> schema:address ?a .
              OPTIONAL {{ ?a schema:streetAddress ?street }}
              OPTIONAL {{ ?a schema:postalCode ?postalCode }} }}
  OPTIONAL {{ <{facility}> edintinf:belongsTo ?d . ?d a esadm:Distrito ; rdfs:label ?district .
              OPTIONAL {{ ?d owl:sameAs ?districtWikidata }} }}
  OPTIONAL {{ <{facility}> edintinf:belongsTo ?n . ?n a esadm:Barrio ; rdfs:label ?neighbourhood .
              OPTIONAL {{ ?n owl:sameAs ?neighbourhoodWikidata }} }}
  OPTIONAL {{ <{facility}> edintinf:accessibility ?accessibility }}
  OPTIONAL {{ <{facility}> bpm:equipment ?equipment }}
  OPTIONAL {{ <{facility}> bpm:transportInfo ?transport }}
  OPTIONAL {{ <{facility}> schema:url ?url }}
  OPTIONAL {{ <{facility}> edintinf:hasInfrastructureType ?t .
              ?t skos:inScheme bpmkos:MadridFacilityTypes ; skos:prefLabel ?typeName }}
}}
GROUP BY ?name ?street ?postalCode ?district ?districtWikidata ?neighbourhood
         ?neighbourhoodWikidata ?accessibility ?equipment ?transport ?url
         ?station ?stationName ?stationType ?distance
"""


def station_pollutants(station):
    """Pollutants (with a reference value) measured at a station."""
    values = " ".join(f"<{RES}pollutant/{slug}>" for slug in REFERENCE)
    return PREFIXES + f"""
SELECT DISTINCT ?pollutant ?name ?property
WHERE {{
  VALUES ?pollutant {{ {values} }}
  ?pollutant skos:prefLabel ?name ; skos:exactMatch ?property .
  ?sensor sosa:isHostedBy <{station}> ; sosa:observes ?property .
}}
ORDER BY ?name
"""


def station_series(station, prop):
    """Daily values of a property at a station during the year."""
    return PREFIXES + f"""
SELECT ?date ?value ?valid
WHERE {{
  ?sensor sosa:isHostedBy <{station}> ; sosa:observes <{prop}> .
  ?obs sosa:madeBySensor ?sensor ;
       sosa:phenomenonTime/time:hasBeginning/time:inXSDDate ?date ;
       sosa:hasSimpleResult ?value ;
       bpm:isValid ?valid .
}}
ORDER BY ?date
"""


def districts(prop):
    """Facilities per district and mean (valid) value of a property at the
    stations located in the district (empty if there is none)."""
    return PREFIXES + f"""
SELECT ?district ?name ?wikidata ?facilities ?stations ?mean
WHERE {{
  {{
    SELECT ?district (COUNT(?f) AS ?facilities)
    WHERE {{ ?f a edintinf:Facility ; edintinf:belongsTo ?district .
             ?district a esadm:Distrito . }}
    GROUP BY ?district
  }}
  ?district rdfs:label ?name .
  OPTIONAL {{ ?district owl:sameAs ?wikidata }}
  OPTIONAL {{
    SELECT ?district (COUNT(DISTINCT ?st) AS ?stations) (AVG(?value) AS ?mean)
    WHERE {{
      ?st a edintmed:SensorPlatform ; edintinf:belongsTo ?district .
      ?sensor sosa:isHostedBy ?st ; sosa:observes <{prop}> .
      ?obs sosa:madeBySensor ?sensor ; bpm:isValid true ; sosa:hasSimpleResult ?value .
    }}
    GROUP BY ?district
  }}
}}
ORDER BY DESC(?facilities)
"""


def ranking(facility_type, prop):
    """Facilities of a Madrid type, ordered by the yearly mean of a property at
    their nearest station (cleanest air first)."""
    return PREFIXES + f"""
SELECT ?facility ?name ?district ?stationName ?distance ?mean
WHERE {{
  {{
    SELECT ?station (AVG(?value) AS ?mean)
    WHERE {{
      ?sensor sosa:isHostedBy ?station ; sosa:observes <{prop}> .
      ?obs sosa:madeBySensor ?sensor ; bpm:isValid true ; sosa:hasSimpleResult ?value .
    }}
    GROUP BY ?station
  }}
  ?facility edintinf:hasInfrastructureType <{facility_type}> ;
            rdfs:label ?name ;
            bpm:hasNearestStation ?station ;
            bpm:distanceToNearestStation ?distance .
  ?station rdfs:label ?stationName .
  OPTIONAL {{ ?facility edintinf:belongsTo ?d . ?d a esadm:Distrito ; rdfs:label ?district }}
}}
ORDER BY ?mean ?distance
"""


# ------------------------------------------------------------------ Wikidata
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"


def wikidata_districts(qids):
    """Population (P1082, with its date P585) and area in km² (P2046) of the
    districts in Wikidata. The Wikidata entities are the ones our districts are
    linked to with owl:sameAs (Hands-on 5), so this data is not in our graph."""
    values = " ".join(f"wd:{qid}" for qid in qids)
    return f"""PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX wikibase: <http://wikiba.se/ontology#>
SELECT ?district ?population ?date ?area
WHERE {{
  VALUES ?district {{ {values} }}
  OPTIONAL {{ ?district p:P1082 ?statement .
             ?statement ps:P1082 ?population .
             OPTIONAL {{ ?statement pq:P585 ?date }} }}
  OPTIONAL {{ ?district p:P2046/psv:P2046 [ wikibase:quantityAmount ?area ;
                                            wikibase:quantityUnit wd:Q712226 ] }}
}}
"""
