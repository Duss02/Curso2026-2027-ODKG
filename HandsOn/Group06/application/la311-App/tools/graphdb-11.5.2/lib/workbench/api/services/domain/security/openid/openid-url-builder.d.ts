/**
 * Builds OpenID Connect URLs for authentication and logout operations.
 *
 * Constructs properly formatted URLs with required parameters based on
 * the configured authentication flow (PKCE, implicit, etc.).
 */
export declare class OpenIdUrlBuilder {
    private readonly securityContextService;
    /**
     * Builds the authorization URL for login with all required parameters.
     * @param state Random state value for CSRF protection
     * @param codeChallenge PKCE code challenge (used for code flows)
     * @param redirectUrl URL to redirect to after authentication
     * @returns Complete authorization URL
     */
    buildLoginUrl(state: string, codeChallenge: string, redirectUrl: string): string;
    /**
     * Builds the logout URL with post-logout redirect.
     * @param redirectUrl URL to redirect to after logout
     * @returns Complete logout URL
     */
    buildLogoutUrl(redirectUrl: string): string;
    /**
     * Gets OpenID security config from context.
     * @returns {OpenidSecurityConfig} OpenID config
     * @throws {OpenIdError} If no config
     */
    private getOpenIdConfig;
    /**
     * Determines the OAuth2 response type based on configured auth flow.
     * @private
     * @returns Response type ('code' or 'token')
     */
    private getResponseType;
    /**
     * Builds base OAuth2 parameters required for all flows.
     * @private
     */
    private buildBaseParameters;
    /**
     * Builds parameters specific to the configured authentication flow.
     * @private
     */
    private buildFlowSpecificParameters;
    /**
     * Builds additional optional parameters from configuration.
     * @private
     */
    private buildAdditionalParameters;
    /**
     * Constructs the OAuth2 scope string with required and optional scopes.
     * @private
     * @returns Space-separated scope string
     */
    private getScope;
}
