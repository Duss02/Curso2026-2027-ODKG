import { EventEmitter } from '../../stencil-public-runtime';
import { DialogHandler } from '../../models/dialog/dialog-handler';
/**
 * OntoCookieConsent component for handling cookie consent functionality.
 * This component displays a cookie consent modal and manages the visibility of a cookie policy dialog.
 * @implements {DialogHandler}
 */
export declare class OntoCookieConsent implements DialogHandler {
    /** State to control the visibility of the cookie policy modal */
    private showModal;
    /** Event emitter for when consent is given */
    consentGiven: EventEmitter<void>;
    /**
     * Listener for the closeDialog event emitted by the cookie policy dialog.
     * Sets the showModal state to false to hide the dialog.
     */
    onDialogClose(): void;
    render(): any;
    /**
     * Opens the cookie policy modal.
     * @param {Event} event - The event that triggered the modal opening.
     */
    private openModal;
    /**
     * Handles the click event on the consent button.
     * Emits the consentGiven event.
     */
    private handleConsentClick;
}
