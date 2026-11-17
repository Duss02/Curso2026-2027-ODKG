import { ToastrPosition } from './toastr-position';
import { ToastConfig } from './toast-config';
/**
 * Configuration class for the entire Toastr container.
 * Provides settings to control the behavior of all toast notifications.
 * Some of these may be overriden by individual toast messages, e.g. timeout.
 *
 * @extends ToastConfig
 */
export declare class ToastrConfig extends ToastConfig {
    private static instance;
    /**
     * The position of the toast container on the screen.
     */
    position: ToastrPosition;
    private constructor();
    /**
     * Returns the default configuration for toast notifications.
     * @returns {ToastrConfig} The singleton instance of ToastrConfig with default settings
     */
    static getDefaultConfig(): ToastrConfig;
}
