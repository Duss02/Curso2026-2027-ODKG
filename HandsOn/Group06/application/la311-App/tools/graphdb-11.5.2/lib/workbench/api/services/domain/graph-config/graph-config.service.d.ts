import { GraphConfigList } from '../../../models/graph-config';
import { Service } from '../../../providers/service/service';
/**
 * Service for interacting with graph configurations.
 */
export declare class GraphConfigService implements Service {
    private readonly graphConfigRestService;
    /**
     * Returns the graph configurations from the REST API.
     *
     * @returns A Promise that resolves to a GraphConfigList containing the graph configurations.
     */
    getGraphConfigs(): Promise<GraphConfigList>;
}
