import { TranslationParameter } from '../translation';
/**
 * Configuration class for individual toast messages.
 * Configuration options here will override the global ToastrConfig settings.
 */
export declare class ToastConfig {
    /**
     * The duration in milliseconds for which the toast notification will be displayed.
     */
    timeout?: number;
    /**
     * A function to be called when the toast notification is clicked.
     */
    onClick?: (event: Event) => void;
    /**
     * Remove the toast notification when it is clicked.
     */
    removeOnClick?: boolean;
    /**
     * The title of the toast notification.
     */
    title?: string;
    /**
     * Translation parameters for the toast message.
     */
    translationParams?: TranslationParameter[];
    constructor(data?: Partial<ToastConfig>);
}
