import { Service } from '../../providers/service/service';
import { Notification } from '../../models/notification';
/**
 * A service for managing notifications.
 *
 * This service provides methods to enqueue, dequeue, peek  notifications. It also allows subscribers to be notified
 * whenever a new notification is added, while keeping full control over queue manipulation.
 */
export declare class NotificationService implements Service {
    /**
     * Internal list of callback functions to notify when a notification is added.
     */
    private notificationAddedCallbackFunctions;
    /**
     * Internal queue storing the notifications.
     */
    private readonly notifications;
    /**
     * Adds a notification to the end of the notification queue.
     *
     * @param notification - The notification to enqueue.
     */
    addNotification(notification: Notification): void;
    /**
     * Removes all notifications from the notification queue and returns them.
     *
     * @returns An array containing all items that were in the queue.
     */
    removeAllNotifications(): Notification[];
    /**
     * Registers a callback function to be invoked whenever a notification is added.
     *
     * @param callbackFunction - The function to be called when the notification queue changes.
     * @returns A function to unsubscribe the callback.
     */
    onNotificationAdded(callbackFunction: (notification: Notification) => void): () => void;
    /**
     * Invokes a single callback function.
     * Called when a callback is registered and there are already notifications in the queue.
     * The caller is immediately notified of the existing notifications.
     *
     * @param callbackFunction - The callback function to invoke.
     */
    private notifyNotificationAdded;
    /**
     * Invokes all registered callback functions to notify subscribers of a queue change.
     */
    private notifyAllNotificationAdded;
}
/**
 * Enqueues a new notification using the global {@link NotificationService}.
 *
 * This function is a convenience wrapper that retrieves the singleton instance of the `NotificationService` via
 * the service locator and adds the provided notification to its queue.
 *
 * @param {Notification} notification - The notification instance to enqueue.
 */
export declare function notify(notification: Notification): void;
