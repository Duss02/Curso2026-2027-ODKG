import { Service } from '../../../providers/service/service';
import { BeforeUpdateQueryResult, ConnectorBuildStatus } from '../../../models/connector';
/**
 * Service for managing connectors.
 */
export declare class ConnectorsService implements Service {
    private readonly connectorsRestService;
    private readonly rdf4jRepositoryService;
    /**
     * Checks connector status.
     * @param query Optional query to check if the connector is enabled for. If not provided, it will check if the
     * connector is enabled in general.
     * @returns Promise resolving with the connector status.
     */
    checkConnector(query?: string): Promise<BeforeUpdateQueryResult>;
    /**
     * Retrieves the current build status of a connector.
     * @param iri - The IRI of the connector instance.
     * @param repositoryId - The ID of the repository to query.
     * @returns A promise resolving to the build status, or null if not available.
     */
    getConnectorBuildStatus(iri: string, repositoryId: string): Promise<ConnectorBuildStatus | null>;
    /**
     * Builds a SPARQL SELECT query that retrieves the build status of a connector instance.
     *
     * The connector status predicate IRI is derived by replacing the `/instance#<id>` suffix
     * of the instance IRI with `#connectorStatus`.
     */
    private createConnectorStatusQuery;
}
