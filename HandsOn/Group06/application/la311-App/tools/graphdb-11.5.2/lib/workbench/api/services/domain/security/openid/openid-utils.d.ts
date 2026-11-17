import { AuthFlowParams } from '../../../../models/security/authentication/openid-auth-flow-models';
export type OpenIdQueryParams = {
    access_token: string | null;
    code: string | null;
    id_token: string | null;
    state: string | null;
};
export declare class OpenIdUtils {
    /**
     * Returns the base64-urlencoded SHA-256 hash for the PKCE challenge.
     *
     * @param {string} v The code verifier string.
     * @returns {string} The encoded hash.
     */
    static pkceChallengeFromVerifier(v: string): string;
    /**
     * Parses the OpenID values from URL parameters or hash fragment
     * and returns them as an object.
     *
     * @param {boolean} isImplicitFlow - If true, parses from URL hash fragment; if false, parses from query parameters.
     * @returns {AuthFlowParams} An object containing the parsed OpenID parameters.
     */
    static parseQueryString(isImplicitFlow: boolean): AuthFlowParams;
}
