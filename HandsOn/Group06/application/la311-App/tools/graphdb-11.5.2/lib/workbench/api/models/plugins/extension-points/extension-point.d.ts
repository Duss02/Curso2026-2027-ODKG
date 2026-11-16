import { Plugin } from '../plugins/plugin';
import { PluginList } from '../plugins/plugin-list';
/**
 * Abstract base class representing an extension point that can hold plugins of type T.
 * Provides methods to add, remove, sort, and retrieve plugins.
 *
 * @template T - Type of plugin this extension point holds (must extend Plugin)
 */
export declare abstract class ExtensionPoint<T extends Plugin> {
    /**
     * Unique name of the extension point
     */
    abstract name: string;
    /**
     * Optional field used to identify plugins uniquely within this extension point
     */
    fieldIdName?: string;
    /**
     * List of plugins registered to this extension point
     */
    plugins: PluginList<T>;
    /**
     * Removes a plugin based on the value of its `fieldIdName` property.
     * Only works if `fieldIdName` is defined.
     *
     * @param plugin - Plugin to remove
     */
    removePluginByFieldIdName(plugin: T): void;
    /**
     * Adds a plugin to this extension point.
     *
     * @param plugin - Plugin instance to add
     */
    addPlugin(plugin: T): void;
    /**
     * Retrieves all plugins registered to this extension point.
     *
     * @returns Array of plugins of type T
     */
    getPlugins(): T[];
    /**
     * Removes a specific plugin instance from this extension point.
     *
     * @param plugin - Plugin instance to remove
     */
    removePlugin(plugin: T): void;
    /**
     * Removes all plugin instances from this extension point.
     */
    removeAllPlugins(): void;
    /**
     * Sorts the plugins using the provided comparator function.
     *
     * @param comparator - Function used to compare two plugins of type T
     */
    sort(comparator: (a: T, b: T) => number): void;
}
