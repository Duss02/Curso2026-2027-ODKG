/**
 * OntoFooter component for rendering the footer of the application.
 * This component displays information about GraphDB, RDF4J, Connectors, and Workbench versions,
 * as well as copyright information.
 */
export declare class OntoFooter {
    /** State variable to store product information */
    private productInfo;
    /** State variable determining weather to show the cookie consent component */
    private shouldShowCookieConsent;
    /** List of subscriptions to manage component lifecycle */
    private readonly subscriptions;
    /** Current year for copyright display */
    private readonly currentYear;
    private readonly productInfoContextService;
    private readonly securityContextService;
    private readonly licenseContextService;
    private readonly trackingService;
    handleConsentGiven(): void;
    render(): any;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private subscribeToProductInfoChange;
    private subscribeToSecurityConfigChange;
    private subscribeToUserChange;
    private subscribeToUserLoginStatusChange;
    /**
     * Determines whether the cookie consent banner should be shown based on the user's authentication status, license
     * type, and cookie consent status.
     * The banner is shown if the user has not accepted the cookie policy and either has free access or is logged in,
     * provided that tracking is allowed by the license. Otherwise, the banner is hidden.
     */
    private setCookieConsentVisibility;
    private subscribeToLicenseChange;
}
