import { License, OperationStatusSummary, SecurityConfig, RepositoryList, Repository } from "../../../../api/dist/ontotext-workbench-api";
/**
 * OntoHeader component for rendering the header of the application.
 * This component includes a search component, license alert (if applicable),
 * repository selector, and language selector.
 */
export declare class OntoHeader {
    private readonly UPDATE_ACTIVE_OPERATION_TIME_INTERVAL;
    private readonly fibonacciGenerator;
    private readonly monitoringService;
    private readonly repositoryContextService;
    private readonly repositoryLocationContextService;
    private readonly repositoryService;
    private readonly securityContextService;
    private readonly toastrService;
    private readonly namespacesService;
    private readonly namespaceContextService;
    private readonly languageService;
    private readonly authService;
    private readonly authorizationService;
    private readonly eventService;
    private readonly configurationContextService;
    private readonly runtimeConfigurationContextService;
    private readonly logger;
    /** The active operations summary for all monitoring operations */
    activeOperations?: OperationStatusSummary;
    /** The current license information */
    license: License;
    isFreeAccessEnabled: boolean;
    /** Whether the search component should appear */
    shouldShowSearch: boolean;
    isHomePage: boolean;
    /** The list of repositories in the database. */
    repositoryList: RepositoryList;
    currentRoute: string;
    /** The model of the currently selected repository, if any. */
    currentRepository: Repository | undefined;
    securityConfig: SecurityConfig;
    private user;
    private showUserMenu;
    private showLoginButton;
    private applicationLogoPath;
    private isActiveLocationLoading;
    private pollingInterval;
    private repositoryItems;
    private totalTripletsFormatter;
    private expansionRatioFormatter;
    /** Array of subscription cleanup functions */
    private readonly subscriptions;
    private skipUpdateActiveOperationsTimes;
    private labels;
    disconnectedCallback(): void;
    connectedCallback(): void;
    render(): any;
    private subscribeToEvents;
    private subscribeToThemeModeChange;
    private subscribeToRepositoryListChanged;
    private subscribeToLicenseChange;
    private subscribeToRepositoryChange;
    private subscribeToSecurityContextChange;
    private subscribeToAuthenticatedUserChange;
    private subscribeToActiveRepositoryLocationChange;
    private subscribeToActiveRepoLoadingChange;
    private subscribeToNavigationEnd;
    private subscribeToLanguageChanged;
    private onTranslate;
    private resetOnMissingRepositories;
    private initOnRepositoryListChanged;
    private updateRepositoryItems;
    private getRepositoriesDropdownItems;
    private readonly getRepositoryPermission;
    private readonly repositorySizeInfoFetcher;
    private loadNamespaces;
    private updateVisibility;
    private startOperationPolling;
    private stopOperationPolling;
    private shouldShowRdfSearch;
    private readonly showViewResourceMessage;
    private setupTotalRepositoryFormater;
    private setupExpansionRatioFormater;
}
