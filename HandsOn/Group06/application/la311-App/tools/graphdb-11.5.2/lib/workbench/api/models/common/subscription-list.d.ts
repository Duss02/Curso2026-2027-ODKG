import { ModelList } from './model-list';
import { Subscription } from './subscription';
/**
 * Represents a list of subscriptions that can be managed collectively.
 * Extends the {@link ModelList} class, specialized for {@link Subscription} type.
 */
export declare class SubscriptionList extends ModelList<Subscription> {
    /**
     * Creates a new instance of SubscriptionList.
     * @param subscriptions - An optional array of Subscription functions to initialize the list.
     */
    constructor(subscriptions?: Subscription[]);
    /**
     * Adds a new subscription to the list.
     * @param subscription - The Subscription function to be added to the list.
     */
    add(subscription: Subscription): void;
    /**
     * Removes a subscription from the list.
     * @param subscription - The Subscription function to be removed from the list.
     */
    remove(subscription: Subscription): void;
    /**
     * Adds multiple subscriptions to the list.
     * @param subscriptions - An array of Subscription functions to be added.
     */
    addAll(subscriptions: Subscription[]): void;
    /**
     * Calls all subscription functions in the list and then clears the list. Calling a subscription
     * function unsubscribes the subscription. This effectively unsubscribes all subscriptions
     * and removes them from the list.
     */
    unsubscribeAll(): void;
}
