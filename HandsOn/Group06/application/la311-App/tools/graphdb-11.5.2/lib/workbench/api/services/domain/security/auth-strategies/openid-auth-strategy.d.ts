import { AuthStrategy, AuthStrategyType } from '../../../../models/security/authentication';
import { AuthenticatedUser } from '../../../../models/security';
/**
 * OpenID Connect authentication strategy implementation.
 *
 * Handles OpenID Connect authentication flows including authorization code,
 * authorization code without PKCE, and implicit flows. Manages the complete
 * authentication lifecycle from initialization through login and logout.
 */
export declare class OpenidAuthStrategy implements AuthStrategy {
    private readonly logger;
    private readonly securityService;
    private readonly authenticationStorageService;
    private readonly authenticationService;
    private readonly securityContextService;
    private readonly openIdService;
    private readonly openidStorageService;
    private readonly tokenUtils;
    type: AuthStrategyType;
    private openIdSecurityConfig;
    /**
     * Creates a new OpenIdAuthStrategy and sets up configuration listeners.
     */
    constructor();
    /**
     * Initializes the OpenID authentication strategy.
     * @returns Promise resolving to true if user is logged in
     * @throws Error if configuration is missing or initialization fails
     */
    initialize(): Promise<boolean>;
    /**
     * Fetches the currently authenticated user.
     *
     * @returns A promise that resolves to the authenticated user.
     */
    fetchAuthenticatedUser(): Promise<AuthenticatedUser>;
    /**
     * Starts the OpenID Connect login flow.
     * @returns Promise that resolves when login flow is initiated
     * @throws Error if configuration is missing or flow type is unknown
     */
    login(): Promise<AuthenticatedUser>;
    /**
     * Logs out the current user and clears authentication data.
     * @returns Promise that resolves when logout is complete
     */
    logout(): Promise<void>;
    /**
     * Checks if the user is currently authenticated.
     * @returns True if user is authenticated, false otherwise
     */
    isAuthenticated(): boolean;
    /**
     * Indicates that this strategy is not for external users.
     * @returns false, as this strategy is not for external authentication.
     */
    isExternal(): boolean;
    /**
     * Sets up listener for security configuration changes.
     * @private
     */
    private setupConfigurationListener;
    /**
     * Loads OpenID security configuration from security context.
     * @private
     */
    private loadSecurityConfiguration;
    /**
     * Validates that OpenID configuration is available.
     * @private
     * @throws Error if configuration is not found
     */
    private validateConfiguration;
    /**
     * Handles post-authentication setup for successful login.
     * @private
     */
    private handleSuccessfulAuthentication;
    /**
     * Loads authenticated user and updates security context.
     * @private
     */
    private loadAndSetAuthenticatedUser;
    /**
     * Handles authentication errors by logging and cleanup.
     * @private
     * @param error The error that occurred
     */
    private handleAuthenticationError;
    /**
     * Gets the return URL for authentication redirect.
     * @private
     * @returns The return URL
     */
    private getReturnUrl;
    /**
     * Executes the appropriate OpenID authentication flow.
     * @private
     * @param authFlow The authentication flow type
     * @param state Random state for CSRF protection
     * @param returnToUrl URL to redirect after authentication
     * @throws Error if flow type is unknown
     */
    private executeAuthFlow;
}
