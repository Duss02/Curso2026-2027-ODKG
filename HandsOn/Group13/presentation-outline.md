# Group13 presentation outline

**Exactly seven slides: one cover, five content slides, and one transition to the demo.**

Based on the [presentation summary](presentation-summary.md). The slides must showcase the actual project artifacts, not just define concepts. Use diagrams, mapping tables, and short real excerpts; the presenter explains the evidence on screen. This document is the outline, not the PowerPoint file.

**Deck requirements:** white background, blue accents, no slide numbers, and no footnotes. Keep technical content readable through structured layouts, not tiny text. The cover and demo transition remain minimal; the five content slides carry the project evidence. Repository links below are preparation references, not slide footnotes.

## Slide 1 - Cover

### On the slide

**Madrid Parking**

Historical occupancy and alternatives through linked data

Sebastian Fernandez · Esteban Alvear

Alessandro Comencini · Nayeli Rosas

### Presenter notes

> Our project transforms Madrid's historical parking data into a linked-data application. Users choose a facility and a month, inspect its historical occupancy, and compare alternatives in the same or bordering districts.
>
> We will briefly explain the dataset, its semantic model, RDF generation, Wikidata reconciliation, and how the application connects the sources.

## Slide 2 - Our dataset

### On the slide

**Madrid's historical municipal parking occupancy**

- Eight original CSV files: 2019-September 2026
- 4,754 monthly observations across 12 represented districts
- Facility, type, capacity, overall and daytime occupancy
- Cleaned and normalized with OpenRefine

| Original value | Prepared value |
|---|---|
| `16,7%` | `16.7` |
| `ROT` / `ROTACIONAL` | `rotational` |
| `MIX` / `MIXTO` | `mixed` |

**Historical data, not live availability.**

### Presenter notes

> We started with Madrid's open dataset of historical municipal parking occupancy. Each row represents a facility's measurements for one year and month, including its district, type, capacity, and occupancy percentages.
>
> We used OpenRefine to normalize district labels and parking types and prepare numeric values. For example, 16 comma 7 percent becomes the numeric percentage 16.7.
>
> The final RDF contains 62 facility resources. That is a resource count, not proof of 62 distinct physical car parks, because our mappings use names and historical name variants can produce separate resources.
>
> These measurements describe past monthly occupancy; they cannot tell us whether a space is available now.

## Slide 3 - URIs, ontology, and vocabulary

### On the slide

**Our full domain ontology: four classes and thirteen custom properties**

```text
ParkingFacility --locatedIn------> District
                --hasParkingType-> ParkingType
                --hasObservation-> OccupancyObservation
                <-observationOf--- OccupancyObservation
```

Display these attributes inside their class boxes. All properties in the diagram and attribute lists use `prop:`; the four classes use `mp:`.

| Class | Complete datatype-property vocabulary and ranges |
|---|---|
| `ParkingFacility` | `parkingName: xsd:string` |
| `District` | `districtName: xsd:string` |
| `ParkingType` | No custom datatype property; generated data uses `rdfs:label` |
| `OccupancyObservation` | `year: xsd:gYear`; `month: xsd:integer`; `numberOfSpaces: xsd:integer`; `calculationDays: xsd:integer`; `averageVehiclesPerDay: xsd:decimal`; `occupancyPercentage: xsd:decimal`; `daytimeOccupancyPercentage: xsd:decimal` |

**URI design**, with base `http://parking.linkeddata.upm.es/`:

```text
mp:       ontology/{Class}
prop:     property/{property}
          resource/parking/{name}
          resource/district/{name}
          resource/parking-type/{type}
          resource/observation/{name}/{year}/{month}
```

**Layout:** four class boxes with their attributes and all four labeled object-property arrows; a compact URI-design panel beside the model. The arrow endpoints show the object properties' domains and ranges. This replaces generic vocabulary-definition bullets.

### Presenter notes

> This is our complete domain model, not a selection of example terms. We defined four classes, four object properties, and nine datatype properties.
>
> Follow the arrows from ParkingFacility: locatedIn points to District, hasParkingType points to ParkingType, and hasObservation points to OccupancyObservation. The observation also links back through observationOf. These endpoints are the declared domains and ranges.
>
> Inside the boxes are all nine custom datatype properties and their ranges. Names are strings; month, capacity, and calculation days are integers; year uses gYear; the three measurement properties use decimals. ParkingType uses the standard rdfs:label in the generated data instead of a custom name property.
>
> The URI panel separates class and property definitions from instances. Facilities, districts, types, and observations have separate paths. For example, one observation ends in ALMAGRO/2019/01. The submitted mappings use names, so name changes can split resource identities.
>
> The key modeling decision is visible in the observation box: capacity and measurements belong to a month, not to an unchanging facility. This diagram is the ontology; its named classes and properties are our vocabulary, expressed with standard RDF, RDFS, OWL, and XSD terms.

**Preparation reference:** [complete ontology](ontology/ontology.ttl).

## Slide 4 - Mappings and RDF generation

### On the slide

```text
Cleaned CSV -> four RML TriplesMaps -> aparcamientos.ttl
```

| TriplesMap | Input references -> generated facts |
|---|---|
| `ParkingFacilityMap` | `NOMBRE_APARCAMIENTO` -> facility URI/name; `DISTRITO`, `TIPO`, `ANIO`, `MES` -> resource links |
| `DistrictMap` | `DISTRITO` -> district URI/name |
| `ParkingTypeMap` | `TIPO` -> type URI and `rdfs:label` |
| `OccupancyObservationMap` | Facility/year/month -> observation URI; `ANIO`, `MES`, `NUM_PLAZAS`, `DIAS_CALCULO`, `VEHICULOS_DIA_MEDIA`, `OCUPACION`, `OCUPACION_9_21` -> typed values |

**Real mapping excerpt** (`xsd:` is the XML Schema datatype namespace):

```turtle
rr:predicate prop:occupancyPercentage ;
rr:objectMap [
    rml:reference "OCUPACION" ;
    rr:datatype xsd:decimal
] .
```

**Generated observation excerpt**, with the common resource base abbreviated:

```turtle
<.../observation/ALMAGRO/2019/01>
    a mp:OccupancyObservation ;
    prop:year "2019"^^xsd:gYear ;
    prop:month 1 ;
    prop:occupancyPercentage 16.7 .
```

**Layout:** mapping coverage table on one side; the conversion rule and its resulting triples on the other. The abbreviated URI is for display, not a copy-paste executable example.

### Presenter notes

> These are the four triples maps in our mapping file and the source columns each one uses. A CSV row contributes facts about a facility, district, type, and monthly observation. Repeated identifiers connect the facts instead of creating disconnected copies.
>
> On the right, the actual predicate-object mapping reads OCUPACION, assigns occupancyPercentage, and declares a decimal datatype. Below it, the generated observation shows what those rules produce: a typed resource with its year, month, and numeric percentage.
>
> Executing the mapping rules materializes the graph. The mappings are the recipe, RDF is the graph of facts, and Turtle is the readable serialization of the output. These are separate roles.
>
> This stage produced the initial unlinked dataset. The next stage changes the input to the linked CSV and extends DistrictMap with an identity-link mapping to produce the reviewed linked RDF.

**Preparation references:** [initial mapping](mappings/mapping.rml.ttl), [linked mapping](mappings/aparcamientos-with-links.rml), [generated RDF](rdf/aparcamientos.ttl).

## Slide 5 - Reconciliation and linking

### On the slide

```text
DISTRITO -> OpenRefine / Wikidata -> same_as_wikidata_distrito
CENTRO                              http://www.wikidata.org/entity/Q1763376
```

**Linked mapping excerpt:**

```turtle
rr:predicate owl:sameAs ;
rr:objectMap [
    rml:reference "same_as_wikidata_distrito" ;
    rr:termType rr:IRI
] .
```

**Result**, with the local resource base abbreviated:

```turtle
<.../district/Centro>
    owl:sameAs <http://www.wikidata.org/entity/Q1763376> .
```

**12 districts -> 12 Wikidata identities -> no missing district links**

**Layout:** show the matched OpenRefine entity/exported column, the actual mapping addition, and the resulting identity edge. The abbreviated local URI is display notation.

### Presenter notes

> Cleaning makes a name consistent; reconciliation identifies which external entity that name represents. In OpenRefine, we reconciled district names against Wikidata and checked the matches so that Centro refers to Madrid's district, not another similarly named place.
>
> We exported each matched entity URI into a new CSV column. The updated district mapping reads that column and generates owl:sameAs links in the final RDF.
>
> The mapping explicitly declares an IRI object. That is why the result points to a resource rather than storing the URL as plain text. The final linked CSV still has 4,754 rows, and all twelve districts have an exported identity.
>
> Reconciliation is the identification decision; linking records that decision. The sameAs relationship asserts identity, not proximity or a shared border.
>
> At this point we know the Wikidata identities. The bordering-district relationships are retrieved later by the application enrichment utility.

**Preparation references:** [reconciliation history](lodrefine/aparcamientos-with-links.json), [linked CSV](CSV/aparcamientos-with-links.csv), [reviewed linked RDF](rdf/aparcamientos-with-links.ttl).

## Slide 6 - The application: three connected local RDF sources

### On the slide

| Local named graph | Source -> contribution |
|---|---|
| `urn:madrid-parking:reviewed` | Reviewed linked RDF -> facilities, observations, `owl:sameAs` |
| `urn:madrid-parking:wikidata` | Wikidata API -> RDF snapshot with `wdt:P47` borders |
| `urn:madrid-parking:geography` | Geoportal GeoJSON -> matched `geo:lat` / `geo:long` RDF |

```text
Selected facility -> local district -> Wikidata district
                                             |
                                             | P47, either direction
                                             v
Alternative facility <- local district <- Wikidata neighbor
        |
        +-> observations / occupancy
        +-> coordinates via the same facility URI
```

**Actual SPARQL border condition** (`wdt:` identifies Wikidata direct properties):

```sparql
FILTER EXISTS {
  GRAPH <urn:madrid-parking:wikidata> {
    ?originWD (wdt:P47|^wdt:P47) ?districtWD .
  }
}
```

**Browser -> Node API -> SPARQL / Fuseki / TDB2 -> cards and map**

**Layout:** the three-source table above a labeled graph-join diagram; short query excerpt alongside. Coordinates come from RDF; district-outline GeoJSON is a separate map asset. Include an application crop only if it does not compromise diagram/query readability.

### Presenter notes

> The app preserves the reviewed linked RDF and adds two separate local RDF snapshots.
>
> For Wikidata, a utility reuses the reconciled district IDs to call the API and save border relationships as RDF. There is no need to reconcile district names again.
>
> For geography, Madrid's Geoportal returns GeoJSON. Another utility matches parking facilities, validates their locations, and automatically converts accepted coordinates into RDF using the existing facility URIs. District outlines remain a separate GeoJSON map asset.
>
> All three RDF sources are loaded into separate named graphs in one local Fuseki dataset. SPARQL joins the original and Wikidata graphs through the district entity URIs, then joins coordinates through the parking facility URIs.
>
> That lets a query find the selected facility's district, follow a border relationship, and retrieve alternatives and their occupancy. Coordinates are optional, so unmapped facilities remain in the lists.
>
> Normal browsing uses local data, not three live APIs. Node sends the SPARQL queries to Fuseki, and the browser displays the results as cards, lists, and colored map markers.
>
> The query excerpt is the actual border condition: the variables carry Wikidata district identities from the reviewed-graph joins, and the path accepts a P47 edge in either recorded direction. It checks one border relationship, not any number of hops.
>
> SPARQL also filters invalid occupancy and calculates the selected calendar month's mean when Average is chosen. It returns counts and contributing years, so different coverage remains visible. This makes the graph relationships operational inputs, not decorative links.

**Preparation references:** [query templates](local-app/queries.mjs), [complete three-graph query](local-app/README.md#example-occupancy-of-facilities-in-bordering-districts).

## Slide 7 - Let's go to the demo

### On the slide

**Let's see it working**

**PLAZA MAYOR -> January -> occupancy -> alternatives -> map**

### Presenter notes

> We will select PLAZA MAYOR and January, first using the average across recorded years and then a specific year.
>
> We will show the occupancy, its contributing observations, alternatives in the same and bordering districts, and their locations on the map.
>
> Finally, we will open the SPARQL evidence to show that the district links and border relationships actually determine the results.

### Demo cue - not slide text

Have the app running before presenting, following the [run instructions](local-app/README.md#1-run-locally).

1. Select **PLAZA MAYOR / January / Average / Overall**: the included dataset's documented result is **47.4% from eight observations**.
2. Change to **2025**: January's recorded occupancy is **49.9%**.
3. Show same-district and bordering-district alternatives and the map.
4. Open the RDF/SPARQL section and identify the border relationship.
