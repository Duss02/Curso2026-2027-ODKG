import { Service } from '../../providers/service/service';
import { Configuration } from '../../models/configuration';
/**
 * Service responsible for managing the application configuration.
 */
export declare class ConfigurationService implements Service {
    private readonly configurationRestService;
    private readonly configurationContextService;
    /**
     * Retrieves the application configuration by fetching it from the server.
     * The configuration is then stored in the ConfigurationContextService for easy access throughout the application.
     *
     * @returns A Promise that resolves to the application configuration object, or undefined if not found.
     */
    getConfiguration(): Promise<Configuration | undefined>;
}
