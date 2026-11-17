import { ExtensionPoint } from './extension-point';
import { Plugin } from '../plugins/plugin';
/**
 * Represents an extension point for the route of the application.
 * Plugins registered to this extension point are used for the creation of the application's routing.
 */
export declare class RouteExtensionPoint extends ExtensionPoint<Plugin> {
    static readonly NAME = "route";
    /**
     * Name of the extension point, used for registration and lookup
     */
    name: string;
}
