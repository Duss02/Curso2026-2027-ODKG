import { MapperFn } from '../../../../providers';
import { ConnectorBuildStatus } from '../../../../models/connector/connector-build-status';
import { SparqlResultsResponse } from '../../../../models/sparql';
/**
 * Maps the SPARQL response from the connector status query to a {@link ConnectorBuildStatus} model.
 *
 * The `?status` binding value is a JSON-encoded {@link ConnectorBuildStatusResponse}.
 * Returns null if the binding is absent or the JSON cannot be parsed.
 */
export declare const mapConnectorBuildStatusResponseToModel: MapperFn<SparqlResultsResponse, ConnectorBuildStatus | null>;
