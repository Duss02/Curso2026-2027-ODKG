import { Plugin } from '../plugin';
/**
 * Represents a plugin with ordering and priority information.
 */
export declare class OrderedPlugin extends Plugin {
    /**
     * Internal order value for the plugin.
     */
    private _order;
    /**
     * Internal priority value for the plugin.
     */
    private _priority;
    /**
     * Gets the order of the plugin.
     */
    get order(): number;
    /**
     * Sets the order of the plugin.
     */
    set order(value: number);
    /**
     * Gets the priority of the plugin.
     */
    get priority(): number;
    /**
     * Sets the priority of the plugin.
     */
    set priority(value: number);
}
