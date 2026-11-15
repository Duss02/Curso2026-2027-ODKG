from pathlib      import Path
from urllib.parse import quote
from flask import Flask, jsonify, render_template, Response
from rdflib import Graph, URIRef, Namespace
from rdflib.namespace import RDF

app = Flask(__name__)
app.json.ensure_ascii = False

# Ruta al RDF existente del grupo
RDF_PATH = (
    Path(__file__).resolve().parent.parent
    / "rdf"
    / "aparcamientos-with-links.ttl"
)

# Cargar el grafo RDF
graph = Graph()
graph.parse(RDF_PATH, format="turtle")

print(f"Grafo cargado: {len(graph)} tripletas RDF")

APARCAMIENTOS_MAP = {}

@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/api/resumen")
def resumen():
    query = """
    PREFIX pm: <https://parking-madrid.example.org/ontology#>

    SELECT (COUNT(?parking) AS ?total)
    WHERE {
        ?parking a pm:ParkingFacility .
    }
    """

    resultados = graph.query(query)
    total = int(next(iter(resultados))[0])

    return jsonify({
        "aparcamientos": total,
        "tripletas_rdf": len(graph)
    })


@app.route("/api/aparcamientos")
def obtener_aparcamientos():

    query = """
    PREFIX pm: <https://parking-madrid.example.org/ontology#>
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

    SELECT ?parking ?codigo ?nombre ?tipo
           ?direccion ?plazas ?lat ?lon
           ?distrito ?barrio ?estado ?url
    WHERE {
        ?parking a pm:ParkingFacility ;
                 pm:hasParCode ?codigo ;
                 pm:hasParkingName ?nombre .

        OPTIONAL {
            ?parking pm:hasParkingType ?tipo .
        }

        OPTIONAL {
            ?parking pm:hasStreetAddress ?direccion .
        }

        OPTIONAL {
            ?parking pm:hasTotalSpaces ?plazas .
        }

        OPTIONAL {
            ?parking geo:lat ?lat .
        }

        OPTIONAL {
            ?parking geo:long ?lon .
        }

        OPTIONAL {
            ?parking pm:locatedInDistrict ?d .
            ?d pm:hasDistrictName ?distrito .
        }

        OPTIONAL {
            ?parking pm:locatedInNeighbourhood ?b .
            ?b pm:hasNeighbourhoodName ?barrio .
        }

        OPTIONAL {
            ?parking pm:hasOperationalStatus ?estado .
        }

        OPTIONAL {
            ?parking pm:hasOfficialURL ?url .
        }
    }
    ORDER BY ?nombre
    """

    global APARCAMIENTOS_MAP

    resultados = graph.query(query)
    aparcamientos = []

    # aparcamientos_dict = {}

    for row in resultados:
        aparcamiento = {
            "uri": str(row.parking),
            "codigo": int(row.codigo),
            "nombre": str(row.nombre),
            "tipo": str(row.tipo) if row.tipo is not None else None,
            "direccion": str(row.direccion) if row.direccion is not None else None,
            "plazas": int(row.plazas) if row.plazas is not None else None,
            "latitud": float(row.lat) if row.lat is not None else None,
            "longitud": float(row.lon) if row.lon is not None else None,
            "distrito": str(row.distrito) if row.distrito is not None else None,
            "barrio": str(row.barrio) if row.barrio is not None else None,
            "estado": str(row.estado) if row.estado is not None else None,
            "url": str(row.url) if row.url is not None else None
        }

        aparcamientos.append(aparcamiento)
        
        APARCAMIENTOS_MAP[int(row.codigo)] = {
            "uri": str(row.parking),
            "codigo": int(row.codigo),
            "nombre": str(row.nombre),
            "tipo": str(row.tipo) if row.tipo is not None else None,
            "direccion": str(row.direccion) if row.direccion is not None else None,
            "plazas": int(row.plazas) if row.plazas is not None else None,
            "latitud": float(row.lat) if row.lat is not None else None,
            "longitud": float(row.lon) if row.lon is not None else None,
            "distrito": str(row.distrito) if row.distrito is not None else None,
            "barrio": str(row.barrio) if row.barrio is not None else None,
            "estado": str(row.estado) if row.estado is not None else None,
            "url": str(row.url) if row.url is not None else None
        }

    return jsonify({
        "total": len(aparcamientos),
        "aparcamientos": aparcamientos
    })


@app.route("/api/aparcamientos/<int:codigo>/ocupacion")
def obtener_ocupacion(codigo):
    pm = Namespace("https://parking-madrid.example.org/ontology#")

    aparc_nombre = APARCAMIENTOS_MAP[codigo]['nombre']
    app.logger.info(f"The nombre of {codigo} is {aparc_nombre}")
    parking_uri = URIRef(
        f"https://parking-madrid.example.org/resource/parking/{quote(aparc_nombre)}"
    )
    app.logger.info(f"Parking URI: {parking_uri}")
    
    # Comprobar que el aparcamiento existe
    if (parking_uri, RDF.type, pm.ParkingFacility) not in graph:
        return jsonify({"error": "Aparcamiento no encontrado"}), 404

    # Consultar las observaciones mensuales asociadas al aparcamiento
    query = """
    PREFIX pm: <https://parking-madrid.example.org/ontology#>

    SELECT ?periodo ?ocupacion ?diurna ?vehiculos
    WHERE {
        ?observacion a pm:MonthlyOccupancy ;
                     pm:isOccupancyOf ?parking ;
                     pm:hasReferencePeriod ?periodo .

        OPTIONAL {
            ?observacion pm:hasOccupancyRate ?ocupacion .
        }

        OPTIONAL {
            ?observacion pm:hasDaytimeOccupancyRate ?diurna .
        }

        OPTIONAL {
            ?observacion pm:hasAverageDailyVehicles ?vehiculos .
        }
    }
    """

    resultados = graph.query(
        query,
        initBindings={"parking": parking_uri}
    )

    if not resultados:
        app.logger.info(f"No results found for {resultados}")
    else:
        app.logger.info(f"Results found for {resultados}")
        for row in resultados:
            app.logger.info(
                f"Periodo: {row.periodo}, "
                f"Ocupacion: {row.ocupacion}, "
                f"Diurna: {row.diurna}, "
                f"Vehiculos: {row.vehiculos}"
            )
    
    observaciones = []

    for fila in resultados:
        anio_str, mes_str = str(fila.periodo).split("-")

        observaciones.append({
            "periodo": str(fila.periodo),
            "anio": int(anio_str),
            "mes": int(mes_str),
            "ocupacion": (
                float(fila.ocupacion)
                if fila.ocupacion is not None else None
            ),
            "ocupacion_diurna": (
                float(fila.diurna)
                if fila.diurna is not None else None
            ),
            "vehiculos_diarios": (
                float(fila.vehiculos)
                if fila.vehiculos is not None else None
            )
        })

    # Orden cronológico: el periodo RDF es texto como "2019-1"
    observaciones.sort(
        key=lambda dato: (dato["anio"], dato["mes"])
    )

    return jsonify({
        "codigo": codigo,
        "total": len(observaciones),
        "observaciones": observaciones
    })


@app.route("/api/aparcamientos/<int:codigo>/rdf")
def obtener_aparcamiento_rdf(codigo):

    pm = Namespace("https://parking-madrid.example.org/ontology#")

    parking_uri = URIRef(
        f"https://parking-madrid.example.org/resource/Parking/{codigo}"
    )

    if (parking_uri, RDF.type, pm.ParkingFacility) not in graph:
        return jsonify({"error": "Aparcamiento no encontrado"}), 404

    # Crear un subgrafo con los datos del aparcamiento
    subgrafo = Graph()

    for prefijo, namespace in graph.namespaces():
        subgrafo.bind(prefijo, namespace)

    # Propiedades directas del aparcamiento
    for predicado, objeto in graph.predicate_objects(parking_uri):
        subgrafo.add((parking_uri, predicado, objeto))

    # Información de distrito y barrio relacionados
    relaciones = [
        pm.locatedInDistrict,
        pm.locatedInNeighbourhood
    ]

    for relacion in relaciones:
        for entidad in graph.objects(parking_uri, relacion):
            for predicado, objeto in graph.predicate_objects(entidad):
                subgrafo.add((entidad, predicado, objeto))

    # Observaciones históricas relacionadas
    for observacion in graph.subjects(pm.isOccupancyOf, parking_uri):
        for predicado, objeto in graph.predicate_objects(observacion):
            subgrafo.add((observacion, predicado, objeto))

    turtle = subgrafo.serialize(format="turtle")

    return Response(
        turtle,
        content_type="text/turtle; charset=utf-8"
    )


if __name__ == "__main__":
    app.run(debug=True)
