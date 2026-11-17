/** Configurazione dell'endpoint e metadati del dataset (FR5). */

export const SPARQL_ENDPOINT: string = import.meta.env.VITE_SPARQL_ENDPOINT ?? '/sparql';
export const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

export const DATASET = {
  title: 'MyLA311 Service Request Data 2025',
  publisher: 'City of Los Angeles · Information Technology Agency',
  url: 'https://data.lacity.org/',
  license: 'CC0 1.0 Universal (public domain dedication)',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  caveat:
    'LA 311 Fieldnotes explores a 2025 CSV extract converted to RDF. It is not a live 311 tracker or a request-submission tool, ' +
    'and request counts are not population-adjusted rates or measures of service quality.',
};
