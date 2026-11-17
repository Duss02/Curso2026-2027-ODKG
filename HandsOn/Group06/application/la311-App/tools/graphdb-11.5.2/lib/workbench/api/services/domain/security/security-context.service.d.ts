import { ContextService } from '../../context';
import { ValueChangeCallback } from '../../../models/context/value-change-callback';
import { DeriveContextServiceContract } from '../../../models/context/update-context-method';
import { AuthenticatedUser, RestrictedPages, SecurityConfig } from '../../../models/security';
import { LifecycleHooks } from '../../../providers/service/lifecycle-hooks';
type SecurityContextFields = {
    readonly RESTRICTED_PAGES: string;
    readonly SECURITY_CONFIG: string;
    readonly AUTHENTICATED_USER: string;
    readonly JSON_WEB_KEYS_SET: string;
    readonly IS_LOGGED_IN: string;
};
type SecurityContextFieldParams = {
    readonly RESTRICTED_PAGES: RestrictedPages;
    readonly SECURITY_CONFIG: SecurityConfig;
    readonly AUTHENTICATED_USER: AuthenticatedUser;
    readonly JSON_WEB_KEYS_SET: Record<string, JsonWebKey & {
        kid: string;
    }>;
    readonly IS_LOGGED_IN: boolean;
};
/**
 * The SecurityContextService class manages the various fields in the security context.
 */
export declare class SecurityContextService extends ContextService<SecurityContextFields> implements DeriveContextServiceContract<SecurityContextFields, SecurityContextFieldParams>, LifecycleHooks {
    readonly RESTRICTED_PAGES = "restrictedPages";
    readonly SECURITY_CONFIG = "securityConfig";
    readonly AUTHENTICATED_USER = "authenticatedUser";
    readonly JSON_WEB_KEYS_SET = "jsonWebKeysSet";
    readonly IS_LOGGED_IN = "isLoggedIn";
    /**
     * Retrieves the restricted pages for the user.
     *
     * @return a map with restricted pages.
     */
    getRestrictedPages(): RestrictedPages;
    /**
     * Updates the restricted pages and notifies subscribers about the change.
     *
     * @param restrictedPages - an object with restricted pages.
     */
    updateRestrictedPages(restrictedPages: RestrictedPages): void;
    /**
     * Registers the <code>callbackFunction</code> to be called whenever the restricted pages are changed.
     *
     * @param callbackFunction - The function to call when the restricted pages are changed.
     * @returns A function to unsubscribe from updates.
     */
    onRestrictedPagesChanged(callbackFunction: ValueChangeCallback<RestrictedPages | undefined>): () => void;
    /**
     * Updates the security configuration in the context.
     * @param securityConfig - The new security configuration to be set.
     */
    updateSecurityConfig(securityConfig: SecurityConfig): void;
    /**
     * Subscribes to changes in the security configuration.
     * @param callbackFunction - A function to be called when the security configuration changes.
     * @returns A function that, when called, unsubscribes from the security configuration changes.
     */
    onSecurityConfigChanged(callbackFunction: ValueChangeCallback<SecurityConfig | undefined>): () => void;
    getSecurityConfig(): SecurityConfig | undefined;
    /**
     * Updates the authenticated user information in the context.
     * @param authenticatedUser - The new authenticated user information to be set.
     */
    updateAuthenticatedUser(authenticatedUser: AuthenticatedUser): void;
    /**
     * Subscribes to changes in the authenticated user information.
     * @param callbackFunction - A function to be called when the authenticated user information changes.
     * @returns A function that, when called, unsubscribes from the authenticated user information changes.
     */
    onAuthenticatedUserChanged(callbackFunction: ValueChangeCallback<AuthenticatedUser | undefined>): () => void;
    /**
     * Retrieves the authenticated user information.
     * @return the authenticated user information or undefined, if there is no user.
     */
    getAuthenticatedUser(): AuthenticatedUser | undefined;
    /**
     * Updates the JSON Web Keys Set (JWKS) in the security context.
     *
     * @param jsonWebKeysSet - A record of JSON Web Keys keyed by their key ID (kid).
     */
    updateJsonWebKeysSet(jsonWebKeysSet: Record<string, JsonWebKey & {
        kid: string;
    }>): void;
    /**
     * Retrieves the JSON Web Keys Set (JWKS) from the security context.
     *
     * @returns A record of JSON Web Keys keyed by key ID (kid), or undefined if no keys are available.
     */
    getJsonWebKeysSet(): Record<string, JsonWebKey & {
        kid: string;
    }> | undefined;
    /**
     * Updates the logged-in status of the user in the context.
     *
     * @param isLoggedIn - A boolean indicating whether the user is logged in.
     */
    updateIsLoggedIn(isLoggedIn: boolean): void;
    /**
     * Retrieves the logged-in status of the user from the context.
     *
     * @returns A boolean indicating whether the user is logged in, or undefined if not set.
     */
    getIsLoggedIn(): boolean | undefined;
    /**
     * Subscribes to changes in the user's logged-in status.
     * @param callbackFunction - A function to be called when the user's logged-in status changes.
     * @returns A function that, when called, unsubscribes from the logged-in status changes.
     */
    onUserLoginStatusChanged(callbackFunction: ValueChangeCallback<boolean | undefined>): () => void;
}
export {};
