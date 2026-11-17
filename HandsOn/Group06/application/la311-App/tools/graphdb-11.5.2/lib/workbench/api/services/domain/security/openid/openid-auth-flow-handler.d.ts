import { OpenidSecurityConfig } from '../../../../models/security';
import { AuthFlowParams } from '../../../../models/security/authentication/openid-auth-flow-models';
export type ExchangeTokensCallback = (code: string, redirectUrl: string, codeVerifier?: string | null) => Promise<void>;
/**
 * Handles OpenID Connect authentication flows including PKCE, code without PKCE, and implicit flows.
 * Manages the complete authentication process from code exchange to token validation.
 */
export declare class OpenIdAuthFlowHandler {
    private readonly logger;
    private readonly tokenUtils;
    private readonly openidStorageService;
    /**
     * Handles authorization code flow for both PKCE and non-PKCE variants.
     * @param config OpenID security configuration
     * @param params Authentication flow parameters from callback
     * @param exchangeTokensCallback Function to exchange code for tokens
     * @returns Promise resolving to true if successful or throws error on failure
     * @throws OpenIdError on failure scenarios
     */
    handleAuthorizationCode(config: OpenidSecurityConfig, params: AuthFlowParams, exchangeTokensCallback: ExchangeTokensCallback): Promise<boolean>;
    /**
     * Handles implicit flow by directly saving tokens from URL parameters.
     * @param config OpenID security configuration
     * @param params Authentication flow parameters containing tokens
     * @returns Promise resolving when tokens are saved
     */
    handleImplicitFlow(config: OpenidSecurityConfig, params: AuthFlowParams): Promise<void>;
    /**
     * Checks if user has existing valid authentication tokens.
     * @param config OpenID security configuration
     * @returns true if authentication is valid, false otherwise
     */
    checkExistingAuthentication(config: OpenidSecurityConfig): boolean;
    /**
     * Stores PKCE state and code verifier for authorization code flow.
     * @param state Random state value for CSRF protection
     */
    storeCodeFlowData(state: string): void;
    /**
     * Builds authorization URL for code flow with PKCE challenge.
     *
     * @returns Complete authorization URL
     */
    getCodeChallengeForCodeFlow(): string;
    /**
     * Handles PKCE flow with state validation and code verifier.
     * @private
     * @param params Authentication flow parameters
     * @param redirectUri Redirect URI used in the authentication request
     * @param exchangeTokensCallback Function to exchange code for tokens
     * @throws OpenIdError on state mismatch or missing code
     */
    private handlePkceFlow;
    /**
     * Handles authorization code flow without PKCE.
     * @private
     * @param code Authorization code
     * @param redirectUri Redirect URI used in the authentication request
     * @param exchangeTokensCallback Function to exchange code for tokens
     */
    private handleCodeNoPkceFlow;
}
