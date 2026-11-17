import { Model } from '../common';
import { AuthSettings } from './auth-settings';
import { OpenidSecurityConfig } from './openid-security-config';
import { AuthSourceType } from './auth-source-type';
/**
 * Represents the security configuration for the application.
 */
export declare class SecurityConfig extends Model<SecurityConfig> {
    authImplementation: AuthSourceType;
    enabled?: boolean;
    passwordLoginEnabled?: boolean;
    freeAccess: AuthSettings;
    overrideAuth: AuthSettings;
    openIdEnabled: boolean;
    freeAccessActive?: boolean;
    hasExternalAuth?: boolean;
    openidSecurityConfig?: OpenidSecurityConfig;
    allowSecurityToggle?: boolean;
    additionalAuthSources: AuthSourceType[];
    constructor(config: Partial<SecurityConfig & {
        methodSettings: {
            openid: Partial<OpenidSecurityConfig>;
        };
    }>);
    isEnabled(): boolean;
    isFreeAccessEnabled(): boolean;
    getFreeAccessAuthSettings(): AuthSettings;
    hasOverrideAuth(): boolean;
    /**
     * Checks if GDB allows security disabling. If true, security can be toggled.
     * Otherwise, security cannot be toggled and is always enabled.
     *
     * @returns true if GDB allows toggling security, false otherwise
     */
    isSecurityToggleAllowed(): boolean;
    hasAdditionalAuthSource(): boolean;
    getAuthSourceType(): AuthSourceType;
    isOpenIdEnabled(): boolean;
    isPasswordLoginEnabled(): boolean;
    hasLocalAdditionalAuthSources(): boolean;
}
