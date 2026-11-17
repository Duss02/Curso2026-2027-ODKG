import { HttpService } from '../../../http/http.service';
import { OpenIdTokens } from '../../../../models/security/authentication/openid-auth-flow-models';
export declare class OpenIdRestService extends HttpService {
    private readonly securityContextService;
    private readonly OAUTH_IDENTITY_DOMAIN_NAME_HEADER;
    /**
     * Fetches the JSON Web Key Set (JWKS) from the OpenID provider.
     */
    getJSONWebKeySet(): Promise<{
        keys: {
            kid: string;
        }[];
    }>;
    /**
     * Refreshes the OpenID tokens using the provided refresh token.
     * @param refreshToken
     */
    refreshToken(refreshToken: string): Promise<OpenIdTokens>;
    /**
     * Exchanges the authorization code for tokens.
     * @param redirectUrl The redirect URL used in the authorization request.
     * @param code The authorization code received from the OpenID provider.
     * @param codeVerifier The PKCE code verifier if PKCE was used, otherwise null or undefined.
     */
    getTokens(redirectUrl: string, code: string, codeVerifier?: string | null): Promise<OpenIdTokens>;
    /**
     * Transforms an object to an application/x-www-form-urlencoded string.
     *
     * @param obj The object to transform.
     * @returns The URL-encoded string.
     */
    private transformURLEncodedRequest;
    private getClientId;
    private getJWKSEndpoint;
    private getTokensEndpoint;
    private getDomainHeaders;
}
