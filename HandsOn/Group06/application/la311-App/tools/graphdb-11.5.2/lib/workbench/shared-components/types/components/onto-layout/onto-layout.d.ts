import { NavbarToggledEvent } from '../onto-navbar/navbar-toggled-event';
import { AuthenticatedUser, SecurityConfig } from "../../../../api/dist/ontotext-workbench-api";
export declare class OntoLayout {
    private readonly authenticationService;
    private readonly authorizationService;
    private readonly navigationContextService;
    private readonly authStorageService;
    private readonly runtimeConfigurationContextService;
    private readonly eventService;
    private readonly applicationLifecycleContextService;
    private readonly userPreferencesService;
    private readonly userPreferencesContextService;
    private readonly guideContextService;
    private readonly fullJwtKey;
    private readonly fullAuthenticatedKey;
    private readonly authEvents;
    hostElement: HTMLOntoLayoutElement;
    private navbarRef;
    authenticatedUser: AuthenticatedUser;
    authToken: string | null;
    securityConfig: SecurityConfig;
    isLowResolution: boolean;
    showHeader: boolean;
    showNavbar: boolean;
    private isEmbedded;
    private loading;
    private hideSolrDeprecationBanner;
    /**
     * List of subscriptions to manage component lifecycle
     * */
    private readonly subscriptions;
    private readonly windowResizeObserver;
    private isNavbarCollapsed;
    constructor();
    componentDidRender(): void;
    componentDidLoad(): void;
    connectedCallback(): void;
    /**
     * Lifecycle method called when the component is about to be removed from the DOM.
     * Unsubscribes from all subscriptions to prevent memory leaks.
     */
    disconnectedCallback(): void;
    render(): any;
    /**
     * Event listener for the navbar toggled event. The layout needs to respond properly when the navbar is toggled in
     * order to fit the content.
     * @param event
     */
    onNavbarToggled(event: CustomEvent<NavbarToggledEvent>): void;
    /**
     * Event listener for window resize event. We need to handle this in order to allow the navbar to collapse when the
     * window is resized.
     */
    onResize(): void;
    private onSolrDeprecationBannerClosedHandler;
    private windowResizeHandler;
    private readonly handleStorageChange;
    private handleAuthChange;
    private subscribeToSecurityChanges;
    private subscribeToRuntimeConfigurationChanges;
    private updateVisibility;
    private isAuthenticatedFully;
    private shouldShowMenu;
    private assignNavbarRef;
    private setNavbarItemVisibility;
    private subscribeToNavigationEnd;
    private subscribeToBeforeMountRouting;
    private subscribeToUserPreferencesChange;
    private subscribeToGuideChanges;
    private updateSolrDeprecationBannerVisibility;
}
