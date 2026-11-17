import { AuthStrategy } from '../../../models/security/authentication';
import { SecurityConfig } from '../../../models/security';
import { Service } from '../../../providers/service/service';
/**
 * Resolves the appropriate authentication strategy based on security configuration.
 *
 * This service acts as a factory that determines which authentication strategy
 * to use based on the current security settings:
 * - NoSecurityStrategy when security is disabled
 * - OpenIdAuthStrategy when OpenID Connect is enabled
 * - GdbTokenAuthStrategy for standard GraphDB token authentication
 */
export declare class AuthStrategyResolver implements Service {
    private readonly securityContextService;
    private readonly authStorageService;
    private authStrategy;
    /**
     * Resolves and returns the appropriate authentication strategy. Sets the internal state strategy for future use.
     *
     * @param securityConfig The current security configuration
     * @returns The authentication strategy instance to use
     */
    resolveStrategy(securityConfig: SecurityConfig): AuthStrategy;
    setStrategy(strategy: AuthStrategy): void;
    /**
     * Gets the currently resolved authentication strategy.
     *
     * @returns The currently resolved authentication strategy, or undefined if not yet resolved
     */
    getAuthStrategy(): AuthStrategy | undefined;
    private _resolveStrategy;
}
