import { ContextService } from '../context';
import { DeriveContextServiceContract } from '../../models/context/update-context-method';
import { Configuration } from '../../models/configuration';
import { ThemeMode } from '../../models/application-settings';
type ConfigurationContextFields = {
    readonly APPLICATION_CONFIGURATION: string;
};
type ConfigurationContextFieldParams = {
    readonly APPLICATION_CONFIGURATION: Configuration;
};
/**
 * The ConfigurationContextService class manages the application's configuration context.
 * It allows updating and retrieving the application configuration.
 */
export declare class ConfigurationContextService extends ContextService<ConfigurationContextFields> implements DeriveContextServiceContract<ConfigurationContextFields, ConfigurationContextFieldParams> {
    readonly APPLICATION_CONFIGURATION = "applicationConfiguration";
    updateApplicationConfiguration(configuration: Configuration): void;
    getApplicationConfiguration(): Configuration;
    /**
     * Gets the application logo path based on the current theme.
     * @param theme The current theme mode.
     * @returns The path to the application logo.
     */
    getApplicationLogoPath(theme: ThemeMode | undefined): string;
}
export {};
