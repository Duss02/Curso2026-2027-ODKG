
"use strict";

// Mapa inicial centrado en Madrid
const map = L.map("map").setView([40.4168, -3.7038], 11);

// Capa de OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Grupo de marcadores

const markerLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 55,
    disableClusteringAtZoom: 16,
    spiderfyOnMaxZoom: true
}).addTo(map);


const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");
const counter = document.getElementById("counter");
const detailDiv = document.getElementById("detail");
const panelOcupacion = document.getElementById("ocupacion-panel");
const tituloOcupacion = document.getElementById("titulo-ocupacion");
const estadoOcupacion = document.getElementById("estado-ocupacion");
const selectorAnio = document.getElementById("anio-ocupacion");
const contenedorGrafico = document.getElementById("grafico-contenedor");
const canvasOcupacion = document.getElementById("grafico-ocupacion");


const resumenEstadistico = document.getElementById("resumen-estadistico");
const tablaContenedor = document.getElementById("tabla-contenedor");
const cabeceraTabla = document.getElementById("cabecera-tabla");
const cuerpoTabla = document.getElementById("cuerpo-tabla");


let observacionesHistoricas = [];
let graficoHistorico = null;
let solicitudOcupacionActual = 0;
const filtroDistrito = document.getElementById("filtro-distrito");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroMinPlazas = document.getElementById("filtro-min-plazas");
const filtroMaxPlazas = document.getElementById("filtro-max-plazas");
const botonLimpiar = document.getElementById("limpiar-filtros");


const selectorComparacion = document.getElementById("comparar-con");
const infoComparacion = document.getElementById("info-comparacion");

let aparcamientoActual = null;
let aparcamientoComparado = null;
let observacionesComparadas = [];
let solicitudComparacionActual = 0;


let aparcamientos = [];
const markers = new Map();

// Normalizar texto para buscar sin distinguir tildes
function normalizar(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}


// Rellenar los filtros con los valores reales del RDF
function rellenarFiltros() {
    const configuracion = [
        [filtroDistrito, "distrito"],
        [filtroTipo, "tipo"]
    ];

    configuracion.forEach(([select, campo]) => {
        const valores = [
            ...new Set(
                aparcamientos
                    .map(p => p[campo])
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, "es"));

        valores.forEach(valor => {
            const opcion = document.createElement("option");
            opcion.value = valor;
            opcion.textContent = valor;
            select.appendChild(opcion);
        });
    });
}


// Cargar datos desde Flask
async function cargarAparcamientos() {
    try {
        const response = await fetch("/api/aparcamientos");

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        aparcamientos = data.aparcamientos;

        rellenarFiltros();
        mostrarAparcamientos();

    } catch (error) {
        console.error(error);
        counter.textContent = "Error al cargar los aparcamientos.";
    }
}

// Mostrar aparcamientos según la búsqueda
function mostrarAparcamientos() {
    const busqueda = normalizar(searchInput.value.trim());


    const filtrados = aparcamientos.filter(p => {

        // Buscar por nombre, código o distrito
        const coincideBusqueda =
            normalizar(p.nombre).includes(busqueda) ||
            String(p.codigo).includes(busqueda) ||
            normalizar(p.distrito).includes(busqueda);

        // Filtrar por distrito
        const coincideDistrito =
            filtroDistrito.value === "" ||
            p.distrito === filtroDistrito.value;

        // Filtrar por tipo
        const coincideTipo =
            filtroTipo.value === "" ||
            p.tipo === filtroTipo.value;

        // Filtrar por capacidad mínima
        const coincideMinimo =
            filtroMinPlazas.value === "" ||
            (p.plazas != null &&
            p.plazas >= Number(filtroMinPlazas.value));

        // Filtrar por capacidad máxima
        const coincideMaximo =
            filtroMaxPlazas.value === "" ||
            (p.plazas != null &&
            p.plazas <= Number(filtroMaxPlazas.value));

        return coincideBusqueda &&
            coincideDistrito &&
            coincideTipo &&
            coincideMinimo &&
            coincideMaximo;
    });


    counter.textContent =
        `${filtrados.length} de ${aparcamientos.length} aparcamientos`;

    markerLayer.clearLayers();
    markers.clear();
    resultsDiv.replaceChildren();

    filtrados.forEach(parking => {

        // Elemento de la lista
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "result-item";
        boton.dataset.codigo = parking.codigo;

        const nombre = document.createElement("strong");
        nombre.textContent = parking.nombre;

        const distrito = document.createElement("small");
        distrito.textContent =
            `${parking.distrito ?? "Distrito desconocido"} · Código ${parking.codigo}`;

        boton.append(nombre, distrito);
        boton.addEventListener("click", () => seleccionar(parking));

        resultsDiv.appendChild(boton);

        // Añadir al mapa si tiene coordenadas
        const lat = parking.latitud;
        const lon = parking.longitud;

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const marker = L.marker([lat, lon]);

            marker.bindTooltip(parking.nombre);
            marker.on("click", () => seleccionar(parking));

            marker.addTo(markerLayer);
            markers.set(String(parking.codigo), marker);
        }
    });
}

// Seleccionar aparcamiento
function seleccionar(parking) {
    mostrarDetalle(parking);
    cargarOcupacion(parking);

    document.querySelectorAll(".result-item").forEach(boton => {
        boton.classList.toggle(
            "active",
            boton.dataset.codigo === String(parking.codigo)
        );
    });

    const marker = markers.get(String(parking.codigo));


    if (marker) {
        markerLayer.zoomToShowLayer(marker, () => {
            map.panTo(marker.getLatLng());
            marker.openTooltip();
        });
    }

}

// Mostrar información del aparcamiento
function mostrarDetalle(parking) {
    detailDiv.replaceChildren();

    const titulo = document.createElement("h2");
    titulo.textContent = parking.nombre;
    detailDiv.appendChild(titulo);

    const campos = [
        ["Código PAR", parking.codigo],
        ["Distrito", parking.distrito],
        ["Barrio", parking.barrio],
        ["Dirección", parking.direccion],
        ["Tipo", parking.tipo],
        ["Plazas", parking.plazas],
        ["Estado", parking.estado]
    ];

    campos.forEach(([etiqueta, valor]) => {
        const parrafo = document.createElement("p");
        const negrita = document.createElement("strong");

        negrita.textContent = `${etiqueta}: `;
        parrafo.append(
            negrita,
            document.createTextNode(String(valor ?? "No disponible"))
        );

        detailDiv.appendChild(parrafo);
    });

    if (parking.url && /^https?:\/\//i.test(parking.url)) {
        const enlace = document.createElement("a");
        enlace.href = parking.url;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = "Ver información oficial";
        detailDiv.appendChild(enlace);
    }
    
// Enlaces geográficos y semánticos
const enlaces = document.createElement("div");
enlaces.className = "enlaces-externos";

const tituloEnlaces = document.createElement("h3");
tituloEnlaces.textContent = "Recursos relacionados";
enlaces.appendChild(tituloEnlaces);

function agregarEnlace(texto, url) {
    const contenedor = document.createElement("div");
    const enlace = document.createElement("a");

    enlace.textContent = texto;
    enlace.href = url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";

    contenedor.appendChild(enlace);
    enlaces.appendChild(contenedor);
}

// Representación RDF generada por Flask
agregarEnlace(
    "Consultar datos RDF (Turtle)",
    `/api/aparcamientos/${parking.codigo}/rdf`
);

// Ubicación geográfica en OpenStreetMap
if (
    Number.isFinite(parking.latitud) &&
    Number.isFinite(parking.longitud)
) {
    const lat = parking.latitud;
    const lon = parking.longitud;

    const urlOSM =
        `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}` +
        `#map=18/${lat}/${lon}`;

    agregarEnlace("Ver ubicación en OpenStreetMap", urlOSM);
}

detailDiv.appendChild(enlaces);

}


// Rellenar los aparcamientos disponibles para comparar
function prepararOpcionesComparacion() {
    selectorComparacion.replaceChildren(
        new Option("Sin comparar", "")
    );

    aparcamientos
        .filter(p => p.codigo !== aparcamientoActual?.codigo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .forEach(p => {
            selectorComparacion.add(
                new Option(
                    `${p.nombre} (${p.codigo})`,
                    String(p.codigo)
                )
            );
        });

    selectorComparacion.disabled = true;
}


// Consultar la ocupación del segundo aparcamiento
async function cargarComparacion() {
    const solicitud = ++solicitudComparacionActual;
    const codigo = selectorComparacion.value;

    aparcamientoComparado = null;
    observacionesComparadas = [];

    if (!codigo) {
        infoComparacion.textContent = "";
        actualizarGrafico();
        return;
    }

    const candidato = aparcamientos.find(
        p => String(p.codigo) === codigo
    );

    if (!candidato) return;

    infoComparacion.textContent = "Cargando comparación...";
    actualizarGrafico();

    try {
        const response = await fetch(
            `/api/aparcamientos/${candidato.codigo}/ocupacion`
        );

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();

        if (solicitud !== solicitudComparacionActual) {
            return;
        }

        if (data.observaciones.length === 0) {
            infoComparacion.textContent =
                `${candidato.nombre} no tiene datos históricos disponibles.`;
            return;
        }

        aparcamientoComparado = candidato;
        observacionesComparadas = data.observaciones;

        const capacidad = p =>
            p.plazas == null
                ? "capacidad desconocida"
                : `${p.plazas} plazas`;

        infoComparacion.textContent =
            `${aparcamientoActual.nombre}: ${capacidad(aparcamientoActual)} · ` +
            `${candidato.nombre}: ${capacidad(candidato)}`;

        actualizarGrafico();

    } catch (error) {
        if (solicitud !== solicitudComparacionActual) {
            return;
        }

        console.error("Error en comparación:", error);

        infoComparacion.textContent =
            "No se ha podido cargar la comparación.";
    }
}

async function cargarOcupacion(parking) {
    // Evitar que respuestas antiguas sustituyan la selección actual
    const solicitud = ++solicitudOcupacionActual;

    aparcamientoActual = parking;
    aparcamientoComparado = null;
    observacionesComparadas = [];

    // Invalidar comparaciones anteriores
    ++solicitudComparacionActual;

    prepararOpcionesComparacion();
    infoComparacion.textContent = "";

    panelOcupacion.hidden = false;
    panelOcupacion.classList.remove("sin-historico");
    tituloOcupacion.textContent = `Ocupación histórica — ${parking.nombre}`;
    estadoOcupacion.textContent = "Cargando datos históricos...";
    selectorAnio.disabled = true;
    selectorAnio.replaceChildren();
    selectorComparacion.disabled = false;
    contenedorGrafico.hidden = true;
    observacionesHistoricas = [];

    
    resumenEstadistico.hidden = true;
    tablaContenedor.hidden = true;

    resumenEstadistico.replaceChildren();
    cuerpoTabla.replaceChildren();


    if (graficoHistorico) {
        graficoHistorico.destroy();
        graficoHistorico = null;
    }

    // Leaflet debe recalcular el tamaño del mapa
    requestAnimationFrame(() => map.invalidateSize());

    try {
        const response = await fetch(
            `/api/aparcamientos/${parking.codigo}/ocupacion`
        );

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();

        // Ignorar respuestas de aparcamientos anteriores
        if (solicitud !== solicitudOcupacionActual) {
            return;
        }

        observacionesHistoricas = data.observaciones;


        if (observacionesHistoricas.length === 0) {
            estadoOcupacion.textContent =
                "Este aparcamiento no tiene datos de ocupación histórica disponibles.";

            panelOcupacion.classList.add("sin-historico");
            selectorComparacion.disabled = true;

            requestAnimationFrame(() => map.invalidateSize());

            return;
        }


        // Obtener los años presentes en los datos
        const anios = [
            ...new Set(observacionesHistoricas.map(o => o.anio))
        ].sort((a, b) => b - a);

        // Opción para visualizar todo el histórico
        selectorAnio.add(new Option("Todos los años", "todos"));

        anios.forEach(anio => {
            selectorAnio.add(new Option(String(anio), String(anio)));
        });

        // Seleccionar el año más reciente
        selectorAnio.value = String(anios[0]);
        selectorAnio.disabled = false;
        contenedorGrafico.hidden = false;

        actualizarGrafico();

    } catch (error) {
        if (solicitud !== solicitudOcupacionActual) {
            return;
        }

        console.error("Error al consultar la ocupación:", error);
        estadoOcupacion.textContent =
            "No se han podido cargar los datos históricos.";
    }
}


function mostrarTablaYResumen(
    etiquetas,
    ocupacionGeneral,
    ocupacionDiurna,
    ocupacionComparada
) {
    const comparando = ocupacionComparada !== null;

    // Formato de números en español
    const formato = new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    const formatear = valor =>
        typeof valor === "number" && Number.isFinite(valor)
            ? `${formato.format(valor)} %`
            : "—";

    // Calcular media ignorando valores ausentes
    function calcularMedia(valores) {
        const validos = valores.filter(
            v => typeof v === "number" && Number.isFinite(v)
        );

        if (validos.length === 0) return null;

        return validos.reduce((a, b) => a + b, 0) /
               validos.length;
    }

    const datosSegundaSerie = comparando
        ? ocupacionComparada
        : ocupacionDiurna;

    const mediaGeneral = calcularMedia(ocupacionGeneral);
    const mediaSegunda = calcularMedia(datosSegundaSerie);

    const mesesConDatos = ocupacionGeneral.filter(
        v => typeof v === "number" && Number.isFinite(v)
    ).length;

    // Crear tarjetas estadísticas
    resumenEstadistico.replaceChildren();

    const estadisticas = [
        [
            comparando
                ? `Media ${aparcamientoActual.nombre}`
                : "Ocupación media general",
            formatear(mediaGeneral)
        ],
        [
            comparando
                ? `Media ${aparcamientoComparado.nombre}`
                : "Ocupación media diurna",
            formatear(mediaSegunda)
        ],
        [
            "Meses con ocupación general",
            `${mesesConDatos} / ${etiquetas.length}`
        ]
    ];

    estadisticas.forEach(([nombre, valor]) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-estadistica";

        const etiqueta = document.createElement("span");
        etiqueta.textContent = nombre;

        const numero = document.createElement("strong");
        numero.textContent = valor;

        tarjeta.append(etiqueta, numero);
        resumenEstadistico.appendChild(tarjeta);
    });

    resumenEstadistico.hidden = false;

    // Crear encabezados de la tabla
    cabeceraTabla.replaceChildren();
    cuerpoTabla.replaceChildren();

    const columnas = comparando
        ? [
            "Mes",
            `${aparcamientoActual.nombre} (%)`,
            `${aparcamientoComparado.nombre} (%)`
        ]
        : [
            "Mes",
            "Ocupación general (%)",
            "Ocupación diurna (%)"
        ];

    columnas.forEach(nombre => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = nombre;
        cabeceraTabla.appendChild(th);
    });

    // Crear filas con los datos mensuales
    etiquetas.forEach((mes, i) => {
        const fila = document.createElement("tr");

        const celdaMes = document.createElement("th");
        celdaMes.scope = "row";
        celdaMes.textContent = mes;
        fila.appendChild(celdaMes);

        [
            ocupacionGeneral[i],
            datosSegundaSerie[i]
        ].forEach(valor => {
            const celda = document.createElement("td");
            celda.textContent = formatear(valor);
            fila.appendChild(celda);
        });

        cuerpoTabla.appendChild(fila);
    });

    tablaContenedor.hidden = false;
}



function actualizarGrafico() {
    if (observacionesHistoricas.length === 0) return;

    if (typeof Chart === "undefined") {
        estadoOcupacion.textContent =
            "No se ha podido cargar Chart.js.";
        return;
    }

    const seleccionado = selectorAnio.value;
    const comparar = aparcamientoComparado !== null;

    const registros = observacionesHistoricas.filter(o =>
        seleccionado === "todos" ||
        o.anio === Number(seleccionado)
    );

    const anios = seleccionado === "todos"
        ? [...new Set(observacionesHistoricas.map(o => o.anio))]
            .sort((a, b) => a - b)
        : [Number(seleccionado)];

    // Indexar las observaciones de ambos aparcamientos
    const indicePrincipal = new Map(
        registros.map(o => [`${o.anio}-${o.mes}`, o])
    );

    const indiceComparado = new Map(
        observacionesComparadas.map(
            o => [`${o.anio}-${o.mes}`, o]
        )
    );

    const etiquetas = [];
    const ocupacionGeneral = [];
    const ocupacionDiurna = [];
    const ocupacionComparada = [];

    anios.forEach(anio => {
        for (let mes = 1; mes <= 12; mes++) {
            const clave = `${anio}-${mes}`;

            const principal = indicePrincipal.get(clave);
            const secundario = indiceComparado.get(clave);

            etiquetas.push(
                `${String(mes).padStart(2, "0")}/${anio}`
            );

            ocupacionGeneral.push(
                principal?.ocupacion ?? null
            );

            ocupacionDiurna.push(
                principal?.ocupacion_diurna ?? null
            );

            ocupacionComparada.push(
                secundario?.ocupacion ?? null
            );
        }
    });

    // Primera curva: ocupación general del aparcamiento principal
    const datasets = [
        {
            label: comparar
                ? `${aparcamientoActual.nombre} (%)`
                : "Ocupación general (%)",
            data: ocupacionGeneral,
            borderColor: "#2563eb",
            backgroundColor: "#2563eb",
            borderWidth: 2,
            tension: 0.2,
            pointRadius: seleccionado === "todos" ? 0 : 3,
            pointHoverRadius: 5,
            spanGaps: false
        }
    ];

    if (comparar) {
        // Segunda curva: ocupación general del otro aparcamiento
        datasets.push({
            label: `${aparcamientoComparado.nombre} (%)`,
            data: ocupacionComparada,
            borderColor: "#e58a35",
            backgroundColor: "#e58a35",
            borderWidth: 2,
            tension: 0.2,
            pointRadius: seleccionado === "todos" ? 0 : 3,
            pointHoverRadius: 5,
            spanGaps: false
        });
    } else {
        // Sin comparación: mostrar ocupación diurna
        datasets.push({
            label: "Ocupación diurna (%)",
            data: ocupacionDiurna,
            borderColor: "#e58a35",
            backgroundColor: "#e58a35",
            borderWidth: 2,
            tension: 0.2,
            pointRadius: seleccionado === "todos" ? 0 : 3,
            pointHoverRadius: 5,
            spanGaps: false
        });
    }

    const anomalias = datasets.reduce(
        (total, serie) =>
            total + serie.data.filter(
                valor => valor !== null && valor > 100
            ).length,
        0
    );

    const mesesComparados = ocupacionComparada.filter(
        valor => valor !== null
    ).length;

    estadoOcupacion.textContent =
        `${registros.length} observaciones del aparcamiento principal.` +
        (comparar
            ? ` ${mesesComparados} meses con ocupación general disponible para el segundo.`
            : "") +
        " Datos históricos, no en tiempo real." +
        (anomalias > 0
            ? ` ${anomalias} valores representados superan el 100 %.`
            : "");

    
    mostrarTablaYResumen(
        etiquetas,
        ocupacionGeneral,
        ocupacionDiurna,
        comparar ? ocupacionComparada : null
    );
        

    if (graficoHistorico) {
        graficoHistorico.destroy();
    }

    graficoHistorico = new Chart(canvasOcupacion, {
        type: "line",

        data: {
            labels: etiquetas,
            datasets: datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    position: "top"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.parsed.y;

                            if (valor == null) {
                                return `${context.dataset.label}: Sin datos`;
                            }

                            return `${context.dataset.label}: ${valor.toFixed(1)} %`;
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 12,
                        maxRotation: 0
                    }
                },

                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Ocupación (%)"
                    }
                }
            }
        }
    });
}



// Actualizar resultados al escribir
searchInput.addEventListener("input", mostrarAparcamientos);


// Actualizar al cambiar los filtros
filtroDistrito.addEventListener("change", mostrarAparcamientos);
filtroTipo.addEventListener("change", mostrarAparcamientos);

filtroMinPlazas.addEventListener("input", mostrarAparcamientos);
filtroMaxPlazas.addEventListener("input", mostrarAparcamientos);

// Limpiar búsqueda y filtros
botonLimpiar.addEventListener("click", () => {
    searchInput.value = "";
    filtroDistrito.value = "";
    filtroTipo.value = "";
    filtroMinPlazas.value = "";
    filtroMaxPlazas.value = "";

    mostrarAparcamientos();
});

selectorAnio.addEventListener("change", actualizarGrafico);
selectorComparacion.addEventListener("change", cargarComparacion);

// Carga inicial
cargarAparcamientos();
