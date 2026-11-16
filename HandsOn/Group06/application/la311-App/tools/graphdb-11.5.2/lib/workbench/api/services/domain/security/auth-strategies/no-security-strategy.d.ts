import { AuthStrategy, AuthStrategyType } from '../../../../models/security/authentication';
import { AuthenticatedUser } from '../../../../models/security';
export declare class NoSecurityStrategy implements AuthStrategy {
    private readonly logger;
    private readonly securityService;
    private readonly securityContextService;
    type: AuthStrategyType;
    /**
     * Initializes the NoSecurityStrategy and loads the admin user.
     *
     * @returns Promise resolving to true if user is logged in
     * */
    initialize(): Promise<boolean>;
    /**
     * Fetches the admin user as Authenticated user.
     *
     * @returns A promise that resolves to the authenticated admin user.
     */
    fetchAuthenticatedUser(): Promise<AuthenticatedUser>;
    /**
     * Logs in a user. In the NoSecurityStrategy, this method does nothing and resolves immediately.
     */
    login(): Promise<AuthenticatedUser>;
    /**
     * Logs out the current user. In the NoSecurityStrategy, this method does nothing and resolves immediately.
     */
    logout(): Promise<void>;
    /**
     * Checks if a user is currently authenticated.
     *
     * @returns True if a user is authenticated, false otherwise.
     */
    isAuthenticated(): boolean;
    /**
     * Indicates that this strategy is not for external users.
     * @returns false, as this strategy is not for external authentication.
     */
    isExternal(): boolean;
}
