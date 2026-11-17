import { select } from "./sparql.js";

// All states in the knowledge graph, with the number of train stops in each.
const STATES_QUERY = `
SELECT ?state ?label (COUNT(?stop) AS ?stopCount) WHERE {
    ?state a dbd:State ;
           rdfs:label ?label .
    OPTIONAL {
        ?stop dbd:atStation/dbd:inCity/dbd:inState ?state .
    }
}
GROUP BY ?state ?label
ORDER BY ?label`;

const form = document.getElementById("state-form");
const list = document.getElementById("state-list");
const status = document.getElementById("state-status");
const submitButton = document.getElementById("show-map");

function getSelectedStates() {
  return [...list.querySelectorAll("input:checked")].map((input) => ({
    uri: input.value,
    label: input.dataset.label,
  }));
}

// States passed back from the map page ("Change selection") start out checked.
const preselected = new Set(new URLSearchParams(location.search).getAll("state"));

function renderStates(states) {
  list.replaceChildren(...states.map(({ state, label, stopCount }) => {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "state";
    input.value = state;
    input.dataset.label = label;
    input.checked = preselected.has(state);

    const name = document.createElement("span");
    name.textContent = label;

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = `${stopCount} stops`;

    const labelElement = document.createElement("label");
    labelElement.append(input, name, count);

    const item = document.createElement("li");
    item.append(labelElement);
    return item;
  }));
}

async function loadStates() {
  try {
    const { rows } = await select(STATES_QUERY);
    if (rows.length === 0) {
      status.textContent = "No states found in the knowledge graph.";
      return;
    }
    renderStates(rows);
    submitButton.disabled = getSelectedStates().length === 0;
    status.hidden = true;
  } catch (error) {
    console.error(error);
    status.textContent = "Could not load the states. Is GraphDB running?";
    status.classList.add("error");
  }
}

list.addEventListener("change", () => {
  submitButton.disabled = getSelectedStates().length === 0;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  for (const { uri } of getSelectedStates()) {
    params.append("state", uri);
  }
  location.href = `map.html?${params}`;
});

loadStates();
