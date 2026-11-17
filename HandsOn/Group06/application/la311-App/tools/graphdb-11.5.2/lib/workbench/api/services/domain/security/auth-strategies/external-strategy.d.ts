import { AuthStrategy, AuthStrategyType } from '../../../../models/security/authentication';
import { AuthenticatedUser } from '../../../../models/security';
export declare class ExternalStrategy implements AuthStrategy {
    private readonly securityService;
    private readonly securityContextService;
    type: AuthStrategyType;
    /**
     * Initializes the authentication provider. Since the user is externally authenticated, we assume he is already logged in.
     * @returns Promise resolving to true, as the external user is assumed to be authenticated.
     */
    initialize(): Promise<boolean>;
    /**
     * Checks if a user is currently authenticated.
     * @returns True if a user is authenticated, false otherwise.
     */
    isAuthenticated(): boolean;
    /**
     * Fetches the currently authenticated user using the security service.
     *
     * @returns A promise that resolves to the authenticated user.
     */
    fetchAuthenticatedUser(): Promise<AuthenticatedUser>;
    login(): Promise<AuthenticatedUser>;
    /**
     * Logs out the current user. Since the user is externally authenticated, this method throws an error.
     */
    logout(): Promise<void>;
    /**
     * Indicates that this strategy is for external users.
     * @returns true, as this strategy is for external authentication.
     */
    isExternal(): boolean;
}
