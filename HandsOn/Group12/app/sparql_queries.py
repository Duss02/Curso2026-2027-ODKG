"""
SPARQL Queries for the Active Madrid Knowledge Graph Application (Group 12).
Target Triplestore: GraphDB Workbench (http://localhost:7200/repositories/active-madrid)
Ontology Namespace: https://w3id.org/active-madrid/ontology#
Resource Namespace: https://w3id.org/active-madrid/resource/
"""

PREFIXES = """
PREFIX am: <https://w3id.org/active-madrid/ontology#>
PREFIX res: <https://w3id.org/active-madrid/resource/>
PREFIX schema: <http://schema.org/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

# 1. Multi-hop query retrieving all 82 municipal sports facilities, their postal addresses,
#    neighborhoods, districts, GPS coordinates, contact details, and Wikidata owl:sameAs links.
GET_ALL_FACILITIES_QUERY = PREFIXES + """
SELECT DISTINCT
    ?facility ?facilityName ?facilityWikidata
    ?lat ?long ?phone ?email ?url
    ?streetAddress ?postalCode
    ?neighborhood ?neighborhoodName ?neighborhoodWikidata
    ?district ?districtName ?districtWikidata
WHERE {
    ?facility a am:SportsFacility ;
              schema:name ?facilityName ;
              geo:lat ?lat ;
              geo:long ?long ;
              schema:address ?address .

    ?address a schema:PostalAddress ;
             schema:streetAddress ?streetAddress ;
             schema:postalCode ?postalCode ;
             am:locatedInNeighborhood ?neighborhood .

    ?neighborhood a am:Neighborhood ;
                  schema:name ?neighborhoodName ;
                  am:locatedInDistrict ?district .

    ?district a am:District ;
              schema:name ?districtName .

    OPTIONAL { ?facility schema:telephone ?phone . }
    OPTIONAL { ?facility schema:email ?email . }
    OPTIONAL { ?facility schema:url ?url . }
    OPTIONAL { ?facility owl:sameAs ?facilityWikidata . }
    OPTIONAL { ?neighborhood owl:sameAs ?neighborhoodWikidata . }
    OPTIONAL { ?district owl:sameAs ?districtWikidata . }
}
ORDER BY ?facilityName
"""

# 2. District-level aggregation query computing facility counts, class counts,
#    total offered capacity, and real-time available places per Madrid district.
GET_DISTRICT_INSIGHTS_QUERY = PREFIXES + """
SELECT
    ?district ?districtName ?districtWikidata
    (COUNT(DISTINCT ?facility) AS ?totalFacilities)
    (COUNT(DISTINCT ?sportsClass) AS ?totalClasses)
    (SUM(?offered) AS ?totalOfferedPlaces)
    (SUM(?available) AS ?totalAvailablePlaces)
WHERE {
    ?district a am:District ;
              schema:name ?districtName .
    OPTIONAL { ?district owl:sameAs ?districtWikidata . }

    ?neighborhood a am:Neighborhood ;
                  am:locatedInDistrict ?district .
    ?address a schema:PostalAddress ;
             am:locatedInNeighborhood ?neighborhood .
    ?facility a am:SportsFacility ;
              schema:address ?address .

    OPTIONAL {
        ?sportsClass a am:SportsClass ;
                     am:takesPlaceAt ?facility ;
                     am:offeredPlaces ?offered ;
                     am:availablePlaces ?available .
    }
}
GROUP BY ?district ?districtName ?districtWikidata
ORDER BY DESC(?totalAvailablePlaces)
"""

# 3. Query retrieving all sport activities, their Wikidata owl:sameAs links,
#    and total number of classes and available spots across Madrid.
GET_ALL_ACTIVITIES_QUERY = PREFIXES + """
SELECT
    ?activity ?activityName ?activityWikidata
    (COUNT(DISTINCT ?sportsClass) AS ?totalClasses)
    (COUNT(DISTINCT ?facility) AS ?facilitiesCount)
    (SUM(?available) AS ?totalAvailablePlaces)
WHERE {
    ?activity a am:SportActivity ;
              schema:name ?activityName .
    OPTIONAL { ?activity owl:sameAs ?activityWikidata . }

    OPTIONAL {
        ?sportsClass a am:SportsClass ;
                     am:hasActivity ?activity ;
                     am:takesPlaceAt ?facility ;
                     am:availablePlaces ?available .
    }
}
GROUP BY ?activity ?activityName ?activityWikidata
ORDER BY ?activityName
"""

# 4. Federated SPARQL query enriching local Madrid districts with population and area
#    fetched live from the Wikidata Query Service endpoint via owl:sameAs links.
WIKIDATA_FEDERATED_DISTRICTS_QUERY = PREFIXES + """
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT DISTINCT ?districtName ?districtWikidata ?population ?areaSqKm
WHERE {
    ?district a am:District ;
              schema:name ?districtName ;
              owl:sameAs ?districtWikidata .

    SERVICE <https://query.wikidata.org/sparql> {
        OPTIONAL { ?districtWikidata wdt:P1082 ?population . }
        OPTIONAL { ?districtWikidata wdt:P2046 ?areaSqKm . }
    }
}
ORDER BY ?districtName
"""


def build_classes_query(
    facility_pk=None,
    district_name=None,
    activity_name=None,
    modality=None,
    only_available=False,
    search_text=None,
    limit=200,
):
    """
    Dynamically constructs a parameterized SPARQL SELECT query to filter
    am:SportsClass instances across facilities, districts, sports, and schedules.
    """
    filters = []

    if facility_pk:
        filters.append(
            f'FILTER(?facility = <https://w3id.org/active-madrid/resource/SportsFacility/{facility_pk}>)'
        )

    if district_name and district_name.upper() != "ALL":
        safe_dist = district_name.replace('"', '\\"')
        filters.append(f'FILTER(LCASE(STR(?districtName)) = LCASE("{safe_dist}"))')

    if activity_name and activity_name.upper() != "ALL":
        safe_act = activity_name.replace('"', '\\"')
        filters.append(f'FILTER(CONTAINS(LCASE(STR(?activityName)), LCASE("{safe_act}")))')

    if modality and modality.upper() in ("OPEN", "CLOSED"):
        prefix_token = "OPEN_" if modality.upper() == "OPEN" else "CLOSED_"
        filters.append(
            f'FILTER(CONTAINS(STR(?sportsClass), "/SportsClass/{prefix_token}"))'
        )

    if only_available:
        filters.append("FILTER(?availablePlaces > 0)")

    if search_text:
        safe_search = search_text.strip().replace('"', '\\"')
        if safe_search:
            filters.append(
                f"""FILTER(
                    CONTAINS(LCASE(STR(?activityName)), LCASE("{safe_search}")) ||
                    CONTAINS(LCASE(STR(?facilityName)), LCASE("{safe_search}")) ||
                    CONTAINS(LCASE(STR(?districtName)), LCASE("{safe_search}")) ||
                    CONTAINS(LCASE(STR(?neighborhoodName)), LCASE("{safe_search}")) ||
                    CONTAINS(LCASE(STR(?className)), LCASE("{safe_search}"))
                )"""
            )

    filter_block = "\n    ".join(filters)

    query = (
        PREFIXES
        + f"""
SELECT DISTINCT
    ?sportsClass ?className
    ?activity ?activityName ?activityWikidata
    ?facility ?facilityName ?facilityWikidata
    ?neighborhoodName ?districtName ?districtWikidata
    ?offeredPlaces ?occupiedPlaces ?availablePlaces
    ?startTime ?endTime
WHERE {{
    ?sportsClass a am:SportsClass ;
                 schema:name ?className ;
                 am:takesPlaceAt ?facility ;
                 am:hasActivity ?activity ;
                 am:offeredPlaces ?offeredPlaces ;
                 am:occupiedPlaces ?occupiedPlaces ;
                 am:availablePlaces ?availablePlaces .

    ?activity a am:SportActivity ;
              schema:name ?activityName .
    OPTIONAL {{ ?activity owl:sameAs ?activityWikidata . }}

    ?facility a am:SportsFacility ;
              schema:name ?facilityName ;
              schema:address ?address .
    OPTIONAL {{ ?facility owl:sameAs ?facilityWikidata . }}

    ?address am:locatedInNeighborhood ?neighborhood .
    ?neighborhood schema:name ?neighborhoodName ;
                  am:locatedInDistrict ?district .
    ?district schema:name ?districtName .
    OPTIONAL {{ ?district owl:sameAs ?districtWikidata . }}

    OPTIONAL {{
        ?sportsClass time:hasTime ?interval .
        ?interval time:hasBeginning ?startTime ;
                  time:hasEnd ?endTime .
    }}

    {filter_block}
}}
ORDER BY DESC(?availablePlaces) ?activityName
LIMIT {int(limit)}
"""
    )
    return query


def build_update_spots_query(class_uri, old_occupied, old_available, new_occupied, new_available):
    """
    Constructs a SPARQL 1.1 Update (DELETE/INSERT) query to update live seat counters
    (am:occupiedPlaces and am:availablePlaces) in GraphDB when a citizen books or cancels a class.
    """
    return (
        PREFIXES
        + f"""
DELETE {{
    <{class_uri}> am:occupiedPlaces "{int(old_occupied)}"^^xsd:nonNegativeInteger ;
                  am:availablePlaces "{int(old_available)}"^^xsd:nonNegativeInteger .
}}
INSERT {{
    <{class_uri}> am:occupiedPlaces "{int(new_occupied)}"^^xsd:nonNegativeInteger ;
                  am:availablePlaces "{int(new_available)}"^^xsd:nonNegativeInteger .
}}
WHERE {{
    <{class_uri}> a am:SportsClass .
}}
"""
    )
