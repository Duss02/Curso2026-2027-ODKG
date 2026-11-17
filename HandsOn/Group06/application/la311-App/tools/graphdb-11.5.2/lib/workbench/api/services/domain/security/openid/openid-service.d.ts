import { Service } from '../../../../providers/service/service';
import { OpenIdTokens } from '../../../../models/security/authentication/openid-auth-flow-models';
/**
 * Service responsible for managing OpenID Connect authentication flows, token management,
 * and security operations within the GraphDB workbench.
 */
export declare class OpenIdService implements Service {
    private readonly logger;
    private readonly openIdRestService;
    private readonly openidStorageService;
    private readonly securityContextService;
    private readonly tokenUtils;
    private readonly authenticationStorageService;
    private readonly authFlowHandler;
    private readonly tokenRefreshManager;
    private readonly openIdUrlBuilder;
    /**
     * Retrieves the JSON Web Key Set (JWKS) from the OpenID provider.
     * The JWKS contains the public keys used to verify JWT tokens.
     *
     * @returns {Promise<{ keys: { kid: string }[] }>} resolving to an object containing an array of keys with their key IDs
     */
    getJSONWebKeySet(): Promise<{
        keys: {
            kid: string;
        }[];
    }>;
    /**
     * Exchanges an authorization code for OpenID tokens.
     * Used after redirect from provider in code flow.
     * @param {string} redirectUrl - Redirect URI used in the flow
     * @param {string} code - Authorization code from provider
     * @param {string | null} [codeVerifier] - PKCE code verifier (optional)
     * @returns {Promise<OpenIdTokens>} Tokens object
     */
    getTokens(redirectUrl: string, code: string, codeVerifier?: string | null): Promise<OpenIdTokens>;
    /**
     * Refreshes access tokens using a refresh token.
     * Saves new tokens and sets up next refresh.
     * Emits logout event on failure.
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<void>} Promise that resolves when tokens are refreshed
     * @throws {OpenIdError} If no OpenID config
     */
    refreshTokens(refreshToken: string): Promise<void>;
    /**
     * Initializes OpenID authentication system.
     * Loads JWKS, checks authentication, and handles pending flows.
     * @returns {Promise<boolean>} True if authenticated, else false
     */
    initializeOpenId(): Promise<boolean>;
    /**
     * Loads JWKS from provider and updates security context.
     * @returns {Promise<void>}
     */
    initializeJsonWebKeySet(): Promise<void>;
    /**
     * Starts authorization code flow with PKCE.
     * Stores state and redirects to provider login.
     * @param {string} state - CSRF protection state
     * @param {string} returnToUrl - Redirect URI after login
     */
    setupCodeFlow(state: string, returnToUrl: string): void;
    /**
     * Starts authorization code flow without PKCE.
     * Clears PKCE verifier and redirects to login.
     * @param {string} state - CSRF protection state
     * @param {string} returnToUrl - Redirect URI after login
     */
    setupCodeNoPkceFlow(state: string, returnToUrl: string): void;
    /**
     * Starts implicit flow for OpenID authentication.
     * Stores nonce and redirects to provider login.
     * @param {string} state - Nonce and CSRF protection state
     * @param {string} returnToUrl - Redirect URI after login
     */
    setupImplicitFlow(state: string, returnToUrl: string): void;
    /**
     * Sets up automatic token refresh based on expiration.
     * @returns {Promise<void>}
     */
    setupTokensRefresh(): Promise<void>;
    /**
     * Clears authentication data, tokens, and refresh timers.
     */
    clearAuthentication(): void;
    /**
     * Initiates logout by clearing authentication.
     */
    logout(logoutFromIDP?: boolean): void;
    /**
     * Gets OpenID security config from context.
     * @returns {OpenidSecurityConfig} OpenID config
     * @throws {OpenIdError} If no config
     */
    private getOpenIdConfig;
    /**
     * Builds a key set mapping from key ID to key object.
     * @param {Array<{ kid: string }>} keys - JWKS keys
     * @returns {Record<string, JsonWebKey & { kid: string }>} Key set
     */
    private buildKeySet;
    /**
     * Handles completion of authentication flow.
     * Processes query params and exchanges codes/tokens.
     * @returns {Promise<boolean>} True if authenticated
     */
    private handleAuthenticationFlow;
    /**
     * Exchanges authorization code for tokens and saves them.
     * Used as callback in code flow.
     * @param {string} code - Authorization code
     * @param {string} redirectUrl - Redirect URI
     * @param {string | null} [codeVerifier] - PKCE code verifier (optional)
     * @returns {Promise<void>}
     * @throws {OpenIdError} If no config or token exchange fails
     */
    private exchangeTokensForCode;
    /**
     * Clears authentication data.
     */
    private softLogout;
    /**
     * Performs hard logout and redirects to provider's logout endpoint.
     * @param {string} redirectUrl - Redirect URI after logout
     */
    private hardLogout;
    /**
     * Redirects browser to specified URL.
     * @param {string} url - Target URL
     */
    private redirectToUrl;
    /**
     * Builds login URL for OpenID provider.
     * @param {string} state - CSRF protection state
     * @param {string} codeChallenge - PKCE code challenge
     * @param {string} redirectUrl - Redirect URI after login
     * @returns {string} Login URL
     * @throws {OpenIdError} If no config
     */
    private getLoginUrl;
    /**
     * Builds logout URL for OpenID provider.
     * @param {string} redirectUrl - Redirect URI after logout
     * @returns {string} Logout URL
     */
    private getLogoutUrl;
}
