import { Service } from '../../providers/service/service';
/**
 * Service that handles the storage change events and triggers the appropriate context property change handlers.
 */
export declare class LocalStorageSubscriptionHandlerService implements Service {
    private readonly logger;
    /**
     * Handles the storage change event and triggers the appropriate context property change handlers.
     * @param event The storage change event.
     */
    handleStorageChange(event: StorageEvent): void;
    /**
     * Resolves the context property change handler for the given namespace and property name.
     * @param namespace The namespace of the context property change handler.
     * @param propertyName The property name of the context property change handler.
     */
    private resolveHandler;
}
