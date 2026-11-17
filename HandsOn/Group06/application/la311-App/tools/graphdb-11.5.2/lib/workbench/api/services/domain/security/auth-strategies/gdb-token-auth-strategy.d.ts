import { AuthStrategy, AuthStrategyType } from '../../../../models/security/authentication';
import { AuthenticatedUser } from '../../../../models/security';
import { LoginData } from '../../../../models/security/authentication/login-data';
export declare class GdbTokenAuthStrategy implements AuthStrategy {
    private readonly securityService;
    private readonly authStorageService;
    private readonly securityContextService;
    type: AuthStrategyType;
    /**
     * Initializes the authentication strategy. If the current route is 'login', resolves immediately.
     * Otherwise, attempts to load the authenticated user and update the security context.
     * Logs an error if the user cannot be loaded.
     * @returns Promise resolving to true if user is logged in
     * */
    initialize(): Promise<boolean>;
    /**
     * Fetches the currently authenticated user using the security service.
     *
     * @returns A promise that resolves to the authenticated user.
     */
    fetchAuthenticatedUser(): Promise<AuthenticatedUser>;
    /**
     * Attempts to log in using the provided username and password.
     * On success, stores the authentication token and updates the authenticated user in the security context.
     * Logs and throws an error if the user cannot be mapped from the response.
     * @param {LoginData} loginData - The login credentials (username and password).
     * @returns {Promise<void>} A promise that resolves when login is complete.
     */
    login(loginData: LoginData): Promise<AuthenticatedUser>;
    private assertIsLoginData;
    private getAuthenticationHeader;
    /**
     * Logs out the current user by clearing the authentication token.
     * @returns {Promise<void>} A promise that resolves when logout is complete.
     */
    logout(): Promise<void>;
    /**
     * Checks if the user is authenticated.
     * Returns true if security is disabled or if an authentication token is present.
     * @returns {boolean} True if authenticated, false otherwise.
     */
    isAuthenticated(): boolean;
    /**
     * Indicates that this strategy is not for external users.
     * @returns false, as this strategy is not for external authentication.
     */
    isExternal(): boolean;
    private isCurrentRouteLogin;
}
