import { Service } from '../../providers/service/service';
import { CookieConsent } from '../../models/tracking';
export declare const COOKIE_CONSENT_CHANGED_EVENT = "cookie-consent-changed-event";
/**
 * Service for managing user tracking based on their cookie consent preferences.
 */
export declare class TrackingService implements Service {
    private readonly securityService;
    private readonly securityContextService;
    private readonly authenticationService;
    private readonly authorizationService;
    private readonly trackingStorageService;
    private readonly licenseService;
    private readonly licenseContextService;
    private readonly installationCookieService;
    private readonly googleAnalyticsCookieService;
    private readonly eventEmitter;
    /**
     * Determines whether tracking is allowed based on the current license and development mode.
     *
     * @return Returns `true` if tracking is allowed, otherwise returns `false`.
     */
    isTrackingAllowed(): boolean;
    /**
     * Accepts the cookie policy for the authenticated user.
     * Consent is persisted either on server or in local storage depending on the user's authentication status and free
     * access settings.
     * If the user is authenticated or security is OFF, the consent is stored in the backend.
     * If the user is not authenticated and security is ON, regardless the free access status, the consent is stored in
     * local storage.
     *
     * @returns A promise that resolves when the request to the backend has passed.
     */
    acceptCookiePolicy(): Promise<void>;
    /**
     * Retrieves the current cookie consent preferences for the user
     *  - If principal has no username => read local storage.
     *  - If none in local storage => return defaults.
     *  - If principal has a username => read from principal.appSettings.
     * @return The current cookie consent preferences for the user.
     */
    getCookieConsent(): CookieConsent;
    /**
     * Checks if tracking is allowed and, if so, fetches the current user consent,
     * then sets or removes tracking cookies accordingly.
     * @returns A promise that resolves when the tracking consent has been applied.
     */
    applyTrackingConsent(): Promise<void> | undefined;
    /**
     * Removes all tracking-related cookies and scripts.
     * This function is called when tracking is not allowed by the license
     * or when the user has opted out of all tracking options.
     */
    cleanUpTracking(): void;
    private updateUserCookieConsent;
}
