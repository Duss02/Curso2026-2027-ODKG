import { ContextService } from './context.service';
import { Service } from '../../providers/service/service';
import { ValueChangeCallback } from '../../models/context/value-change-callback';
import { BeforeChangeValidationPromise } from '../../models/context/before-change-validation-promise';
/**
 * Manages subscriptions to value changes across all registered ContextService instances.
 *
 * This class enables centralized handling of property change events, allowing consumers to subscribe
 * to all context-managed values at once, including those from context registered later.
 */
export declare class ContextSubscriptionManager implements Service {
    private readonly subscribers;
    private readonly unsubFns;
    /**
     * Subscribes a ContextService instance to all currently registered global subscriptions.
     *
     * This ensures that the provided service receives all value change notifications
     * configured through {@link subscribeToAllRegisteredContexts}.
     *
     * @param service - The ContextService instance whose properties should be globally observed.
     * @returns A function that, when called, unsubscribes this service from all global subscriptions.
     */
    subscribeToService(service: ContextService<Record<string, unknown>>): () => void;
    /**
     * Subscribes globally to all currently registered context services and ensures that future ones
     * receive the same callbacks as well.
     *
     * @param callback - Function that will be called for every value change.
     * @param beforeChangeValidationPromise - Optional validation function called before value is applied.
     * @param afterChangeCallback - Optional function called after value is updated.
     * @returns A function that unsubscribes from all context changes.
     */
    subscribeToAllRegisteredContexts(callback: ValueChangeCallback<unknown>, beforeChangeValidationPromise?: BeforeChangeValidationPromise<unknown>, afterChangeCallback?: ValueChangeCallback<unknown>): () => void;
}
