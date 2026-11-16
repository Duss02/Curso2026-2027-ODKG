import { Model } from '../common';
/**
 * Configuration model for OpenID Connect authentication settings.
 *
 * Contains all necessary configuration parameters for OpenID Connect integration
 * including endpoints, client credentials, and authentication flow settings.
 */
export declare class OpenidSecurityConfig extends Model<OpenidSecurityConfig> {
    clientId?: string;
    issuer?: string;
    tokenType?: string;
    tokenAudience?: string;
    tokenIssuer?: string;
    oidcTokenEndpoint?: string;
    oidcJwksUri?: string;
    oidcEndSessionEndpoint?: string;
    oidcAuthorizationEndpoint?: string;
    oidcScopesSupported?: string[];
    oracleDomain?: string;
    proxyOidc?: boolean;
    authFlow?: string;
    extraScopes?: string;
    authorizeParameters?: string;
    openIdTokenUrl?: string;
    openIdKeysUri?: string;
    openIdEndSessionUrl?: string;
    supportsOfflineAccess?: boolean;
    constructor(config?: Partial<OpenidSecurityConfig>);
}
