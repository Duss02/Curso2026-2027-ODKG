import { Service } from '../../providers/service/service';
import { ToastConfig } from '../../models/toastr/toast-config';
/**
 * Service for displaying toast notifications in the application.
 */
export declare class OntoToastrService implements Service {
    private readonly eventEmitter;
    private readonly notificationService;
    constructor();
    /**
     * Displays an error toast notification.
     *
     * @param message - The text message to be displayed in the toast
     * @param config - Additional configuration for the toast notification
     */
    error(message: string, config?: ToastConfig): void;
    /**
     * Displays an informational toast notification.
     *
     * @param message - The text message to be displayed in the toast
     * @param config - Additional configuration for the toast notification
     */
    info(message: string, config?: ToastConfig): void;
    /**
     * Displays a success toast notification.
     *
     * @param message - The text message to be displayed in the toast
     * @param config - Additional configuration for the toast notification
     */
    success(message: string, config?: ToastConfig): void;
    /**
     * Displays a warning toast notification.
     *
     * @param message - The text message to be displayed in the toast
     * @param config - Additional configuration for the toast notification
     */
    warning(message: string, config?: ToastConfig): void;
    private createToastElement;
    private subscribeToNotificationEvents;
}
