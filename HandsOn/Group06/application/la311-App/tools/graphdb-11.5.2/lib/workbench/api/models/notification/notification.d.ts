import { NotificationType } from './notification-type';
import { IdModel } from '../common/id-model';
/**
 * Represents a notification message with a unique identifier, a code, and optional parameters.
 */
export declare class Notification extends IdModel<Notification> {
    /**
     * The code representing the type of the notification.
     * This code can be used to determine the content and behavior of the notification when displayed.
     */
    readonly code: string;
    /**
     * Optional title for the notification.
     */
    title?: string;
    /**
     * The notification type.
     */
    type?: NotificationType;
    /**
     * Optional key-value parameters associated with the notification.
     */
    parameters?: Record<string, unknown>;
    /**
     * Creates a new Notification instance with the specified code and optional additional fields.
     *
     * @param code - The code representing the notification type.
     */
    constructor(code: string);
    /**
     * Sets the title of the notification.
     *
     * @param title - The title to set.
     * @returns This notification instance for method chaining.
     */
    withTitle(title: string): this;
    /**
     * Sets the type of the notification.
     *
     * @param type - The notification type to set.
     * @returns This notification instance for method chaining.
     */
    withType(type: NotificationType): this;
    /**
     * Sets the parameters of the notification.
     *
     * @param parameters - The parameters to set.
     * @returns This notification instance for method chaining.
     */
    withParameters(parameters: Record<string, unknown>): this;
    static info(code: string): Notification;
    static error(code: string): Notification;
    static warning(code: string): Notification;
    static success(code: string): Notification;
}
