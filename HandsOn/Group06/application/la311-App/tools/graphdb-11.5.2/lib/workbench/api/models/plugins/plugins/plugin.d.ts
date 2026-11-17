import { Model } from '../../common';
/**
 * Represents a plugin in the application.
 */
export declare class Plugin extends Model<Plugin> {
    /**
     * Internal flag indicating whether the plugin is disabled.
     */
    private _disabled;
    /**
     * Dynamic properties for the plugin.
     */
    [key: string]: unknown;
    constructor(plugin?: Partial<Plugin>);
    /**
     * Gets the disabled state of the plugin.
     */
    get disabled(): boolean;
    /**
     * Sets the disabled state of the plugin.
     * @param {boolean} value - `true` to disable the plugin, `false` to enable it.
     */
    set disabled(value: boolean);
}
