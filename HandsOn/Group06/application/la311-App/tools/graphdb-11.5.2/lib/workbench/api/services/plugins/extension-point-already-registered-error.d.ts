import { ErrorBase } from '../../error';
import { ExtensionPoint, Plugin } from '../../models/plugins';
/**
 * Error thrown when attempting to register an extension point that has already been registered in the system.
 */
export declare class ExtensionPointAlreadyRegisteredError extends ErrorBase {
    /**
     * Creates a new instance of ExtensionPointAlreadyRegisteredError.
     *
     * @param {ExtensionPoint<Plugin>} extensionPoint - The extension point that is already registered.
     */
    constructor(extensionPoint: ExtensionPoint<Plugin>);
}
