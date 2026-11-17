import { HttpService } from '../../http/http.service';
import { ConnectorResponse } from './response/connector-response';
/**
 * Service for making REST calls related to connectors.
 */
export declare class ConnectorsRestService extends HttpService {
    private readonly CONNECTORS_ENDPOINT;
    /**
     * Check if connector is enabled.
     * @param query Optional query to check if the connector is enabled for. If not provided, it will check if the
     * connector is enabled in general.
     * @returns Promise resolving with the response of the check connector endpoint.
     */
    checkConnector(query?: string): Promise<ConnectorResponse>;
}
