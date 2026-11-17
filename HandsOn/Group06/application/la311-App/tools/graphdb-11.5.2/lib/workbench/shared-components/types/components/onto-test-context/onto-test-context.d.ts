import { License, ProductInfo, SecurityConfig, ToastMessage, RepositoryReference, Notification, User, Configuration } from "../../../../api/dist/ontotext-workbench-api";
/**
 * A component for managing test context in the application. Used only for testing
 */
export declare class OntoTestContext {
    private readonly bundles;
    private readonly eventEmitter;
    constructor();
    /**
     * Initializes the application configuration context.
     *
     * This method uses the ConfigurationContextService to update the application
     * configuration and returns a resolved Promise once the operation is complete.
     * @param configuration - The new Configuration object to be set.
     * @returns A Promise that resolves when the configuration update is complete.
     */
    initConfigurationContext(configuration: Configuration): Promise<void>;
    /**
     * Updates the license information in the context.
     *
     * This method uses the LicenseContextService to update the license
     * and returns a resolved Promise once the operation is complete.
     *
     * @param license - The new License object to be set.
     * @returns A Promise that resolves when the license update is complete.
     */
    updateLicense(license: License): Promise<void>;
    /**
     * Updates the product information in the context.
     *
     * This method uses the ProductInfoContextService to update the product information
     * and returns a resolved Promise once the operation is complete.
     *
     * @param productInfo - The new ProductInfo object to be set.
     * @returns A Promise that resolves when the product information update is complete.
     */
    updateProductInfo(productInfo: ProductInfo): Promise<void>;
    /**
     * Loads the repositories in the application.
     */
    loadRepositories(): Promise<void>;
    /**
     * Sets the authenticated user in the application context.
     *
     * @param user - The AuthenticatedUser object containing the user's authentication information.
     * @returns A Promise that resolves when the authenticated user has been successfully updated
     */
    setAuthenticatedUser(user: User): Promise<void>;
    /**
     * Sets the security configuration in the application context.
     *
     * @param securityConfig - The SecurityConfig object containing the new security settings to be applied.
     * @returns A Promise that resolves when the security configuration has been successfully updated.
     */
    setSecurityConfig(securityConfig: SecurityConfig): Promise<void>;
    /**
     * Logs in a user with the provided username and password.
     *
     * This method uses the AuthenticationService to perform the login operation.
     * It returns a Promise that resolves when the login process is complete.
     * @param username
     * @param password
     */
    login(username: string, password: string): Promise<void>;
    /**
     * Changes the application's language by updating the language bundle.
     *
     * This method uses the LanguageContextService to update the language bundle
     * based on the provided language code. It retrieves the corresponding bundle
     * from the predefined bundles object and updates the context.
     *
     * @param language - The language code (e.g., 'en' for English, 'fr' for French)
     *                   representing the desired language to switch to.
     * @returns A Promise that resolves when the language update is complete.
     */
    changeLanguage(language: string): Promise<void>;
    /**
     * Emits {@see NavigationEnd} event with <code>oldUrl</code> and <code>newUrl</code>.
     * @param oldUrl - the value will be used as old url in the event payload.
     * @param newUrl - the value will be used as new url in the event payload.
     */
    emitNavigateEndEvent(oldUrl: string, newUrl: string): Promise<void>;
    /**
     * Updates the selected repository in the application context.
     *
     * @method updateSelectedRepository
     * @param repositoryReference - The RepositoryReference object representing the repository to select.
     * @returns A Promise that resolves when the selected repository has been updated.
     */
    updateSelectedRepository(repositoryReference: RepositoryReference): Promise<void>;
    /**
     * Updates whether the active repository request is in a loading state.
     *
     * @param isLoading - A boolean value indicating whether the repository location is in a loading state.
     *                    True indicates request is in progress, false indicates loading is complete.
     * @returns A Promise that resolves when the loading state update is complete.
     */
    updateIsLoadingActiveRepositoryLocation(isLoading: boolean): Promise<void>;
    /**
     * Opens the confirm cancel dialog.
     *
     * @param hasDontShowAgain - Whether to show the "Don't show again" button in the dialog.
     */
    openConfirmCancel(hasDontShowAgain: boolean): Promise<void>;
    /**
     * Opens a toast
     *
     * @param toast the toast to open
     */
    addToastr(toast: ToastMessage): Promise<void>;
    /**
     * Adds a notification to the application.
     * @param notification - The Notification object containing the notification details.
     */
    addNotification(notification: Notification): Promise<void>;
    /**
     * Sets the autocomplete status in the context.
     *
     * @param enabled whether autocomplete is enabled or disabled.
     */
    setAutocomplete(enabled: boolean): Promise<void>;
    /**
     * Sets the namespace map in the application context.
     *
     * @param rawNamespaces - The namespace map containing prefix-to-URI mappings to be used throughout the application
     * @returns A Promise that resolves when the namespace map has been successfully updated
     */
    updateNamespaces(rawNamespaces: Record<string, string>): Promise<void>;
    /**
     * Sets up a listener for language changes and updates the application language accordingly.
     *
     * This private method subscribes to language change events using the LanguageContextService.
     * When a new language is selected, it calls the changeLanguage method to update the application's language.
     */
    private onLanguageChanged;
    /**
     * Configures the authentication strategy based on the provided security configuration.
     *
     * This private method retrieves the AuthenticationService and sets the authentication strategy
     * according to the given SecurityConfig. It ensures that the application uses the correct
     * authentication mechanism as specified in the security settings.
     *
     * @param securityConfig - The SecurityConfig object containing the security settings to be applied.
     */
    private setAuthStrategy;
    /**
     * Creates a SecurityConfig instance, merging default values with any provided overrides.
     *
     * This private method constructs a SecurityConfig object by combining default settings
     * with any specified overrides. It ensures that all necessary properties are set,
     * providing a complete configuration for security-related operations.
     * @param overrides
     * @private
     */
    private createSecurityConfig;
}
