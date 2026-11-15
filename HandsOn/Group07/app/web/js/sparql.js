const ENDPOINT = "http://localhost:7200/repositories/db-delays";
const PREFIXES = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dbd: <https://example.org/db-delays/ontology#>
`;

export async function select(query) {
  const response = await sendQuery(query);
  if (!response.ok) {
    throw new Error(`GraphDB returned ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  console.log("Received answer from GraphDB");

  const rows = json.results.bindings.map((binding) =>
    Object.fromEntries(Object.entries(binding)
    .map(([name, term]) => [name, term.value]))
    );

  return { vars: json.head.vars, rows };
}

async function sendQuery(query) {
  console.log(`Sent following query to ${ENDPOINT}: ${query}`);
  return await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/sparql-results+json"
    },
    body: new URLSearchParams({ query: PREFIXES + query }),
  });
}
