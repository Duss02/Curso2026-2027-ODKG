import { EventEmitter } from '../../../stencil-public-runtime';
import { ToggleEventPayload } from '../../../models/toggle-switch/toggle-event-payload';
export declare class OntoCookiePolicyDialog {
    private readonly logger;
    private readonly securityContextService;
    private readonly securityService;
    private readonly trackingService;
    private user;
    private cookieConsent;
    private closeButton;
    /**
     * Debounced version of the `toggleChanged` method to prevent rapid consecutive calls when the user toggles cookie
     * consent options multiple times in quick succession.
     * This is needed because the `toggleChanged` method involves adding and removing tracking scripts based on the user's
     * consent, and rapid toggling can lead to multiple unnecessary script manipulations, which can cause performance
     * issues and unintended side effects.
     */
    private readonly toggleChangedDebounced;
    /**
     * Event emitted when the dialog is closed, allowing parent components to react accordingly.
     */
    closeDialog: EventEmitter<void>;
    toggleChangeHandler(event: CustomEvent<ToggleEventPayload>): void;
    componentDidLoad(): void;
    private toggleChanged;
    connectedCallback(): void;
    render(): any;
    /**
     * TODO: This is comment from the previous implementation in the legacy and needs to be re-evaluated and updated if necessary.
     *
     * Closes the modal and passes a result to indicate if the page should be reloaded.
     *  - The page reloads only if the user has
     *    (1) toggled third-party consent multiple times (`didAbusedThirdPartyToggle`),
     *    (2) left third-party consent as enabled (`hasThirdPartyConsent`), and
     *    (3) previously accepted the overall policy (`hasPolicyAccepted`)
     *  - This reload is necessary in cases where multiple third-party consent changes
     *    lead to duplicate and redundant tracking data being loaded.
     */
    private readonly closePolicyDialog;
    private updateCookieConsent;
    private setUserCookieConsent;
}
