import { Service } from '../../../providers/service/service';
import { AuthenticatedUser } from '../../../models/security';
/**
 * Service responsible for handling authentication operations and managing auth strategies.
 *
 * Provides a unified interface for authentication regardless of the underlying strategy
 * (basic auth, OpenID Connect, etc.) and manages authentication state and events.
 */
export declare class AuthenticationService implements Service {
    private readonly eventService;
    private readonly authStrategyResolver;
    private readonly authorizationService;
    private readonly securityContextService;
    private readonly authenticationStorageService;
    private readonly navigationContextService;
    /**
     * Checks if an authentication strategy has been configured.
     * @returns True if strategy is set
     */
    isAuthenticationStrategySet(): boolean;
    getCurrentUser(): Promise<AuthenticatedUser>;
    /**
     * Authenticates the user with username and password.
     *
     * Stores the auth token (if returned), updates the security context
     * with the mapped user, and returns the authenticated user model.
     *
     * @param loginData - The login credentials (username and password). Optional, as some strategies might not require it.
     * @returns A promise that resolves when login is complete.
     */
    login(loginData?: unknown): Promise<void>;
    /**
     * Logs out the current user and emits logout event.
     * Updates security context for logout request.
     */
    logout(): Promise<void>;
    /**
     * Checks if the user is logged in based on the provided configuration and user details.
     * @returns {boolean} True if the user is authenticated, false otherwise.
     */
    isLoggedIn(): boolean;
    /**
     * Check if the user is authenticated.
     * A user is considered authenticated, if security is disabled, if he is external, or if there is an
     * auth token in the store
     *
     * @throws Error if authentication strategy is not set
     * @returns True if the user is authenticated, false otherwise.
     */
    isAuthenticated(): boolean;
    /**
     * Checks if the current user is an external user (e.g., authenticated via Kerberos or X.509).
     * Each strategy is responsible for providing the external status of the {@link AuthenticatedUser}
     *
     * @returns {boolean} True if the user is external, false otherwise.
     * @Throws {@link AuthenticationStrategyNotSet}.if no strategy is set, when calling this method
     */
    isExternalUser(): boolean;
    /**
     * Checks if security is enabled
     * @returns True if security is enabled, false otherwise.
     */
    isSecurityEnabled(): boolean;
    /**
     * Retrieves the current security configuration.
     * @private
     * @returns Current security config or undefined if not set
     */
    private getSecurityConfig;
    private getAuthenticationStrategy;
}
