import { Service } from '../../providers/service/service';
import { PluginsManifest } from '../../models/plugins';
/**
 * Service responsible for managing plugins in the application.
 * Handles retrieving plugin manifests and loading plugins into the application.
 */
export declare class PluginsService implements Service {
    private readonly pluginsRestService;
    private readonly logger;
    constructor();
    /**
     * Retrieves the plugins manifest from the server.
     *
     * @returns A promise that resolves to the plugins manifest containing information about available plugins.
     */
    getPluginsManifest(): Promise<PluginsManifest>;
    /**
     * Loads all available plugins into the application.
     *
     * This method retrieves the plugins manifest, loads the plugin modules,
     * filters out any undefined modules, and registers each valid plugin
     * with the application's plugin registry.
     *
     * If the plugins manifest cannot be loaded, the application will continue to function with built-in plugins only.
     *
     * @returns A promise that resolves when all plugins have been loaded and registered.
     */
    loadPlugins(): Promise<void>;
}
