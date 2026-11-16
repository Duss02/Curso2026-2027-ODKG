export const reviewedGraph = 'urn:madrid-parking:reviewed';
export const wikidataGraph = 'urn:madrid-parking:wikidata';
export const geographyGraph = 'urn:madrid-parking:geography';
export const prefixes = `
PREFIX mp: <http://parking.linkeddata.upm.es/ontology/>
PREFIX prop: <http://parking.linkeddata.upm.es/property/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
`;
export const seedsQuery = `${prefixes}
SELECT DISTINCT ?district ?name ?wd WHERE {
  GRAPH <${reviewedGraph}> {
    ?district a mp:District ; prop:districtName ?name ; owl:sameAs ?wd .
  }
} ORDER BY ?name`;

const source = body => `GRAPH <${reviewedGraph}> { ${body} }`;
const external = body => `GRAPH <${wikidataGraph}> { ${body} }`;
const literal = value => JSON.stringify(value);
const iri = value => `<${value}>`;

export function makeQuery(operation, params, allowed) {
  const member = (key, values, required = false) => {
    const value = params[key] ?? '';
    if (typeof value !== 'string' || (required && !value) || (value && !values.has(value))) {
      throw new RangeError(`Unsupported ${key}. Choose a value returned by the dataset.`);
    }
    return value;
  };
  if (operation === 'catalog') {
    return `${prefixes}
SELECT ?kind ?value ?label ?other WHERE {
  { ${source('?value a mp:District ; prop:districtName ?label ; owl:sameAs ?other .')}
    BIND("district" AS ?kind) }
  UNION { ${source('?value a mp:ParkingType ; rdfs:label ?label .')}
    BIND("type" AS ?kind) }
  UNION { ${source('?o a mp:OccupancyObservation ; prop:year ?value ; prop:month ?other .')}
    BIND("period" AS ?kind) BIND(STR(?value) AS ?label) }
  UNION { ${source('?value a mp:ParkingFacility ; prop:parkingName ?label ; prop:locatedIn ?other .')}
    BIND("parking" AS ?kind) }
}
GROUP BY ?kind ?value ?label ?other
ORDER BY ?kind ?label ?other`;
  }
  if (operation === 'coverage') {
    return `${prefixes}
SELECT ?facilities ?districts ?observations ?invalidOverall ?invalidDaytime ?retrieved ?edges ?mapped ?geographyRetrieved WHERE {
  { SELECT (COUNT(DISTINCT ?p) AS ?facilities) WHERE { ${source('?p a mp:ParkingFacility .')} } }
  { SELECT (COUNT(DISTINCT ?d) AS ?districts) WHERE { ${source('?d a mp:District .')} } }
  { SELECT (COUNT(DISTINCT ?o) AS ?observations) WHERE { ${source('?o a mp:OccupancyObservation .')} } }
  { SELECT (COUNT(DISTINCT ?o) AS ?invalidOverall) WHERE {
      ${source('?o prop:occupancyPercentage ?v .')} FILTER (?v < 0 || ?v > 100) } }
  { SELECT (COUNT(DISTINCT ?o) AS ?invalidDaytime) WHERE {
      ${source('?o prop:daytimeOccupancyPercentage ?v .')} FILTER (?v < 0 || ?v > 100) } }
  { SELECT (COUNT(*) AS ?edges) WHERE { ${external('?s wdt:P47 ?t .')} } }
  { SELECT (COUNT(DISTINCT ?p) AS ?mapped) WHERE { GRAPH <${geographyGraph}> { ?p geo:lat ?lat ; geo:long ?lon . } } }
  OPTIONAL { GRAPH <${geographyGraph}> { <urn:madrid-parking:geography-snapshot> dct:created ?geographyRetrieved . } }
  ${external('<urn:madrid-parking:snapshot> dct:created ?retrieved .')}
}`;
  }
  const metric = member('metric', new Set(['overall', 'daytime']), true);
  const predicate = metric === 'overall' ? 'prop:occupancyPercentage' : 'prop:daytimeOccupancyPercentage';
  if (operation === 'facilityComparison') {
    const parking = member('parking', allowed.parkings, true);
    const originDistrict = member('originDistrict', allowed.districts, true);
    const year = member('year', new Set([...allowed.years, 'average']), true);
    const month = member('month', new Set(Array.from({ length: 12 }, (_, i) => String(i + 1))), true);
    const type = member('type', allowed.types);
    const district = member('district', allowed.districts);
    return `${prefixes}
SELECT ?parking ?name ?district ?districtName ?districtWD ?originDistrict ?originWD
       ?relationship ?occupancy ?samples ?recorded ?excluded ?years ?minSpaces ?maxSpaces
       ?latitude ?longitude
WHERE {
  ${source(`VALUES ?originDistrict { ${iri(originDistrict)} }
    ${iri(parking)} prop:locatedIn ?originDistrict .
    ?originDistrict owl:sameAs ?originWD .`)}
  {
    SELECT ?parking ?name ?district ?districtName ?districtWD
           (AVG(?usable) AS ?mean) (COUNT(?usable) AS ?samples)
           (COUNT(?observation) AS ?recorded)
           (SUM(IF(BOUND(?raw) && !?valid, 1, 0)) AS ?excluded)
           (GROUP_CONCAT(DISTINCT ?usableYear; separator=",") AS ?years)
           (MIN(?usableSpaces) AS ?minSpaces) (MAX(?usableSpaces) AS ?maxSpaces)
    WHERE {
      ${source(`?parking a mp:ParkingFacility ; prop:parkingName ?name ; prop:locatedIn ?district .
        ?district prop:districtName ?districtName ; owl:sameAs ?districtWD .
        OPTIONAL {
          ?parking prop:hasObservation ?observation .
          ?observation prop:year ?year ; prop:month ${month} ; prop:numberOfSpaces ?spaces .
          ${year === 'average' ? '' : `FILTER (?year = ${literal(year)}^^xsd:gYear)`}
          OPTIONAL { ?observation ${predicate} ?raw . }
          BIND(BOUND(?raw) && ?raw >= 0 && ?raw <= 100 AS ?valid)
          # An expression error leaves the binding absent, so AVG/COUNT skip invalid values.
          BIND(IF(?valid, ?raw, 1/0) AS ?usable)
          BIND(IF(?valid, STR(?year), 1/0) AS ?usableYear)
          BIND(IF(?valid, ?spaces, 1/0) AS ?usableSpaces)
        }`)}
    } GROUP BY ?parking ?name ?district ?districtName ?districtWD
  }
  BIND(IF(?samples > 0, ?mean, 1/0) AS ?occupancy)
  FILTER (?district = ?originDistrict || EXISTS {
    ${external('?originWD (wdt:P47|^wdt:P47) ?districtWD .')}
  })
  FILTER (?district = ?originDistrict || NOT EXISTS {
    ${source('?parking prop:locatedIn ?originDistrict .')}
  })
  FILTER (?district = ?originDistrict || NOT EXISTS {
    ${source('?parking prop:locatedIn ?earlierDistrict . ?earlierDistrict owl:sameAs ?earlierWD .')}
    FILTER (STR(?earlierDistrict) < STR(?district))
    ${external('?originWD (wdt:P47|^wdt:P47) ?earlierWD .')}
    ${district ? `FILTER (?earlierDistrict = ${iri(district)})` : ''}
  })
  ${type ? `FILTER (?parking = ${iri(parking)} || EXISTS { ${source(`?parking prop:hasParkingType ${iri(type)} .`)} })` : ''}
  ${district ? `FILTER (?parking = ${iri(parking)} || ?district = ${iri(district)})` : ''}
  BIND(IF(?parking = ${iri(parking)}, "selected",
    IF(?district = ?originDistrict, "same", "border")) AS ?relationship)
  OPTIONAL { GRAPH <${geographyGraph}> { ?parking geo:lat ?latitude ; geo:long ?longitude . } }
}
ORDER BY ?relationship DESC(?samples > 0) ?occupancy ?name`;
  }
  if (operation === 'history') {
    const parking = member('parking', allowed.parkings, true);
    return `${prefixes}
SELECT ?observation ?year ?month ?spaces ?occupancy ?valid WHERE {
  ${source(`${iri(parking)} prop:hasObservation ?observation .
    ?observation prop:year ?year ; prop:month ?month ;
      prop:numberOfSpaces ?spaces ; ${predicate} ?occupancy .`)}
  BIND((?occupancy >= 0 && ?occupancy <= 100) AS ?valid)
} ORDER BY ?year ?month`;
  }
  const district = member('district', allowed.districts, operation !== 'search');
  if (operation === 'neighbors') {
    return `${prefixes}
SELECT DISTINCT ?originWD ?neighborWD ?neighborLabel ?district ?districtName
                ?edgeSubject ?edgeObject WHERE {
  ${source(`${iri(district)} owl:sameAs ?originWD .`)}
  ${external(`{ ?originWD wdt:P47 ?neighborWD .
      BIND(?originWD AS ?edgeSubject) BIND(?neighborWD AS ?edgeObject) }
    UNION { ?neighborWD wdt:P47 ?originWD .
      BIND(?neighborWD AS ?edgeSubject) BIND(?originWD AS ?edgeObject) }
    OPTIONAL { ?neighborWD rdfs:label ?neighborLabel . }`)}
  OPTIONAL { ${source('?district a mp:District ; owl:sameAs ?neighborWD ; prop:districtName ?districtName .')} }
  FILTER (?originWD != ?neighborWD)
} ORDER BY ?neighborLabel ?districtName`;
  }
  const type = member('type', allowed.types);
  const year = member('year', allowed.years, true);
  const month = member('month', new Set(Array.from({ length: 12 }, (_, i) => String(i + 1))), true);
  const typeFilter = type
    ? `FILTER EXISTS { ${source(`?parking prop:hasParkingType ${iri(type)} .`)} }` : '';
  const origin = district ? `${iri(district)}` : '';
  let districtFilter = district ? `FILTER (?district = ${origin})` : '';
  if (operation === 'compare' || operation === 'comparisonCoverage') {
    districtFilter = `
      ${source(`${origin} owl:sameAs ?originWD .`)}
      FILTER (?district = ${origin} || EXISTS {
        ${external('?originWD (wdt:P47|^wdt:P47) ?districtWD .')}
      })
      BIND(IF(?district = ${origin}, "Selected district", "Neighboring district") AS ?relationship)
      ${operation === 'compare' ? 'FILTER (?valid)' : ''}
    `;
  } else if (operation !== 'search') {
    throw new RangeError('Unknown query operation.');
  }
  const where = `
  ${source(`?parking a mp:ParkingFacility ; prop:parkingName ?name ;
    prop:locatedIn ?district ; prop:hasObservation ?observation ;
    prop:hasParkingType ?recordedType .
    ?recordedType rdfs:label ?typeLabel .
    ?district prop:districtName ?districtName ; owl:sameAs ?districtWD .
    ?observation prop:year ${literal(year)}^^xsd:gYear ; prop:month ${month} ;
      prop:numberOfSpaces ?spaces ; ${predicate} ?occupancy .`)}
  BIND((?occupancy >= 0 && ?occupancy <= 100) AS ?valid)
  ${typeFilter}
  ${districtFilter}`;
  if (operation === 'comparisonCoverage') {
    return `${prefixes}
SELECT ?district (COUNT(?observation) AS ?total)
       (SUM(IF(?valid, 1, 0)) AS ?validCount) WHERE {
  { SELECT DISTINCT ?district ?observation ?valid WHERE { ${where} } }
} GROUP BY ?district`;
  }
  return `${prefixes}
SELECT ?parking ?name ?district ?districtName ?districtWD ?observation ?spaces
       ?occupancy ?valid ?relationship
       (GROUP_CONCAT(DISTINCT ?typeLabel; separator=", ") AS ?types)
WHERE { ${where} }
GROUP BY ?parking ?name ?district ?districtName ?districtWD ?observation
         ?spaces ?occupancy ?valid ?relationship
ORDER BY DESC(?valid) ?occupancy ?name`;
}
