import { OpenidSecurityConfig } from '../../../../models/security/openid-security-config';
import { TokenType } from '../../../../models/security/authentication/openid-token-type';
import { OpenIdTokens } from '../../../../models/security/authentication/openid-auth-flow-models';
export declare class OpenidTokenUtils {
    private readonly logger;
    private readonly openidStorageService;
    private readonly securityContextService;
    private readonly REFRESH_TOKEN_TOLERANCE;
    /**
     * Determines if there is a valid ID token. A valid ID token means we are logged in.
     *
     * @param {OpenidSecurityConfig} openIdSecurityConfig - The OpenID security configuration
     * @returns {boolean} True if there is a valid ID token, false otherwise
     */
    hasValidIdToken(openIdSecurityConfig: OpenidSecurityConfig): boolean;
    /**
     * Determines if there is a valid refresh token.
     * If the refresh token is JWT it will be valid only if it hasn't expired yet.
     * It is always valid if it's JWT without expiration or non-JWT (opaque token).
     *
     * @returns {boolean} True if there is a valid refresh token, false otherwise.
     */
    hasValidRefreshToken(): boolean;
    /**
     * Saves the retrieved tokens to local storage and cleans up temporary OpenID data.
     *
     * @param {OpenIdTokens} token - The token data to save
     * @param {OpenidSecurityConfig} openIdSecurityConfig - The OpenID security configuration
     */
    saveTokens(token: OpenIdTokens, openIdSecurityConfig: OpenidSecurityConfig): void;
    /**
     * Returns the Authorization header to use when we logged in via OpenID.
     * The header is composed of the keyword Bearer followed by a space and either the access
     * or the id token (according to the GraphDB configuration)
     *
     * @returns {string} The Authorization header value.
     */
    authHeaderGraphDB(): string;
    /**
     * Decodes a JWT token and returns its header as an object. If there is no such token the empty
     * object will be returned. If the token isn't a JWT token an object with a single
     * property 'error' will be returned.
     *
     * The token header contains information on the cryptographic signature.
     *
     * @param {string} token - The token
     * @returns {Object|undefined} The decoded token header or empty object if no token
     */
    getTokenHeader(token: string): object | undefined;
    /**
     * Decodes a JWT token and returns its data as an object. If there is no such token the empty
     * object will be returned. If the token isn't a JWT token an object with a single
     * property 'error' will be returned.
     *
     * The token payload contains the actual information in the token.
     *
     * @param {string} token - The token
     * @returns {Object|undefined} The decoded token payload or empty object if no token
     */
    getTokenPayload(token: string): object | undefined;
    /**
     * Verifies that a token exists and it's valid. Tokens are valid if they are JWT tokens
     * issued by the expected issuer to the expected audience and signed by a known public key.
     *
     * ID token only: if a nonce was used on login it must match as well.
     *
     * Refresh token only: only the issuer will be verified but not the audience.
     *
     * Non-JWT (opaque) tokens are always valid.
     *
     * @param {TokenType} tokenType - The token type: access, id or refresh
     * @param {OpenidSecurityConfig} openIdSecurityConfig - The OpenID security configuration
     * @returns {boolean} True if the token is valid, false otherwise
     */
    verifyToken(tokenType: TokenType, openIdSecurityConfig: OpenidSecurityConfig): boolean;
    /**
     * Clears all stored tokens from local storage.
     */
    clearTokens(): void;
    /**
     * Retrieves a token of the specified type from storage.
     *
     * @param {TokenType} tokenType - The token type: access, id or refresh
     * @returns {string | null} The token string if found, null otherwise
     */
    getTokenByType(tokenType: TokenType): string | null;
}
