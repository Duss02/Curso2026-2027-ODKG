import { Event } from '../../models/events';
import { Service } from '../../providers/service/service';
/**
 * A service that manages event subscriptions and emissions.
 *
 * Allows components or modules to subscribe to specific events and be notified when those events are emitted.
 */
export declare class EventService implements Service {
    /**
     * A map of event names to their corresponding list of subscribers.
     */
    private eventSubscribers;
    /**
     * Emits an event to all subscribers of the specified event type.
     *
     * @template T - The type of the event payload.
     * @param event - The event to emit, containing its name and payload.
     */
    emit<T extends {} | undefined>(event: Event<T>): void;
    /**
     * Subscribes to a specific event with a callback function.
     *
     * @template T - The type of the event payload.
     * @param eventName - The name of the event to subscribe to.
     * @param callback - A callback function to handle the event notifications.
     *
     * @returns A function to unsubscribe from the event.
     */
    subscribe<T extends {} | undefined>(eventName: string, callback: (payload: T) => void): () => void;
    /**
     * Unsubscribes an observer from a specific event type.
     *
     * @template T - The type of the event payload.
     * @param eventName - The name of the event to unsubscribe from.
     * @param observer - The observer to remove from the subscribers list.
     *
     * @private
     */
    private unsubscribe;
}
