import { ToastMessage } from "../../../../api/dist/ontotext-workbench-api";
/**
 * OntoToastr component for displaying toast notifications.
 *
 * This component manages a list of toast messages and handles their display,
 * automatic removal after timeout, and user interactions like hover behavior.
 */
export declare class OntoToastr {
    /**
     * State containing the list of active toast messages
     */
    private toasts;
    /**
     * Map to track timeout IDs for each toast message
     */
    private toastToTimeout;
    /** Configuration options, such as toast timeout */
    private readonly config;
    /**
     * Listen for toast creation events
     *
     * @param event - Custom event containing the toast message to be displayed
     */
    handleToastCreate(event: CustomEvent<ToastMessage>): void;
    render(): any;
    private onToastMouseEnter;
    private onToastMouseLeave;
    /**
     * Adds a new toast message.
     * The message is added to the start of the list, so new toasts appear on top.
     * The toast is also set to automatically be removed after the specified timeout.
     *
     * @param toast - The toast message to be added
     */
    private addToast;
    /**
     * Sets a timeout for automatic removal of a toast message.
     * The value of the timeout is determined by the toast's configuration, or the default timeout, if
     * the toast hasn't provided a value
     *
     * @param toast - The toast message to set timeout for
     */
    private setTimeoutForToast;
    /**
     * Updates the toast list reference to trigger re-rendering
     */
    private updateToastrReference;
    /**
     * Clears the timeout for a toast message and removes it from the tracking map
     * When a user hovers over a toast message, the timeout is cleared, since the toast should
     * remain visible until the user stops hovering.
     *
     * @param toast - The toast message whose timeout should be cleared
     */
    private clearToastTimeout;
    /**
     * Handle click events on toast messages.
     * Executes the configured onClick callback for the toast message, if provided.
     * Removes the toast message, if the removeOnClick configuration is enabled.
     *
     * @param toast - The clicked toast message
     * @returns An event handler function that processes click events on the toast
     */
    private handleToastClick;
    private handleKeyUp;
}
