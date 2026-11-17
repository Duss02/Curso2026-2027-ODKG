import { HttpService } from '../http/http.service';
import { PluginModule, PluginsManifest } from '../../models/plugins';
import { PluginsManifestResponse } from './response/plugins-manifest-response';
/**
 * Service responsible for handling REST operations related to plugins.
 */
export declare class PluginsRestService extends HttpService {
    private readonly configurationContextService;
    private readonly logger;
    /**
     * Fetches the plugins manifest from the server.
     *
     * @returns A Promise that resolves to the plugins manifest object containing
     * information about available plugins.
     */
    getPluginsManifest(): Promise<PluginsManifestResponse>;
    /**
     * Dynamically loads all plugins defined in the plugins manifest.
     *
     * @param pluginsManifest - The manifest object containing the list of plugins to load.
     * Each plugin definition includes entry points.
     *
     * @returns A Promise that resolves to an array of loaded plugin modules.
     */
    loadPlugins(pluginsManifest: PluginsManifest): Promise<(PluginModule | undefined)[]>;
}
