import { Plugin, ExtensionPoint } from '../../models/plugins';
import { OrderedPlugin } from '../../models/plugins/plugins/ordered/ordered-plugin';
/**
 * Manages plugin registration and retrieval for all extension points in the application.
 */
export declare class PluginRegistry {
    /**
     * Stores all registered extension points, keyed by their names.
     */
    private readonly extensionPoints;
    /**
     * Creates a new instance of the PluginRegistry with the provided extension points.
     *
     * @param {Record<string, ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>>} extensionPoints
     *   A mapping of extension point names to their corresponding extension point instances.
     *   Each entry defines a specific extension point (e.g., main menu, routes, themes)
     *   that can register and manage plugins.
     */
    constructor(extensionPoints?: Record<string, ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>>);
    /**
     * Registers a new extension point in the plugin registry.
     *
     * Throws an error if an extension point with the same name is already registered, to prevent accidental overwrites.
     *
     * @param {ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>} extensionPoint
     *   The extension point instance to register. The `name` property of the extension point is used as the unique key in the registry.
     *
     * @throws {Error} If an extension point with the same name already exists.
     */
    registerExtensionPoint(extensionPoint: ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>): void;
    /**
     * Adds a plugin or multiple plugins to the registry for a specific extension point.
     * If a plugin has a unique ID and a plugin with the same ID already exists, the new plugin will replace the old one.
     *
     * @param extensionPointName - The name of the extension point to which the plugin(s) should be added.
     * @param plugin - The plugin or array of plugins to add to the registry.
     */
    add(extensionPointName: string, plugin: Plugin | Plugin[] | undefined): void;
    /**
     * Retrieves all plugins registered for a given extension point.
     *
     * @param extensionPointName - The extension point name for which to retrieve plugins.
     * @returns An array of plugins registered for the specified extension point.
     */
    get<T extends Plugin>(extensionPointName: string): T[];
    /**
     * Finds a plugin in a specific extension point that matches a given predicate.
     *
     * @param extensionPointName - The name of the extension point to search.
     * @param predicate - A function to test each plugin.
     * @returns The first plugin matching the predicate, or undefined if none is found.
     */
    findPlugin<T extends Plugin>(extensionPointName: string, predicate: (item: T) => boolean): T | undefined;
    /**
     * Returns all extension points along with their registered plugins.
     *
     * @returns {Record<string, ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>>}
     *   A mapping of extension point names to their corresponding extension point instances.
     */
    getExtensionPoints(): Record<string, ExtensionPoint<Plugin> | ExtensionPoint<OrderedPlugin>>;
    /**
     * Removes all plugins registered under a specific extension point.
     *
     * @param {string} extensionPointName - The name of the extension point to clear.
     */
    clear(extensionPointName: string): void;
    /**
     * Removes all plugins from all extension points in the registry.
     */
    clearAll(): void;
    /**
     * Retrieves an extension point by its name.
     *
     * @param extensionPointName - The name of the extension point to retrieve.
     * @returns The requested extension point.
     * @throws {Error} If the extension point with the given name does not exist.
     */
    private getExtensionPoint;
    /**
     * Registers the given plugin with the specified extension point.
     *
     * Disabled plugins are ignored. If the extension point is configured with a unique ID,
     * any existing plugin with the same ID will be removed before registering the new plugin.
     *
     * For ordered extension points, plugins are processed according to their `order` and `priority`.
     *
     * @param {ExtensionPoint<Plugin>} extensionPoint - The extension point where the plugin will be registered.
     * @param {Plugin} plugin - The plugin to register.
     */
    private registerPlugin;
    /**
     * Handles registration and sorting of ordered plugins.
     * Ensures that plugins with the same order but lower priority are replaced.
     *
     * @param plugin - The ordered plugin to register.
     * @param extensionPoint - The extension point for ordered plugins.
     * @throws {Error} If a plugin with the same order and priority already exists.
     */
    private processOrderedPlugin;
}
