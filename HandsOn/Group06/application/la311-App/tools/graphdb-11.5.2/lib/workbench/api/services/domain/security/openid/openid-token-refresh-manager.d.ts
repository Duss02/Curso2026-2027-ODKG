/**
 * Manages automatic refresh of OpenID Connect tokens before they expire.
 *
 * Handles scheduling and execution of token refresh operations using refresh tokens,
 * with automatic timing based on token expiration times.
 */
export declare class OpenIdTokenRefreshManager {
    private readonly DEFAULT_REFRESH_CONFIGURATION;
    private readonly logger;
    private readonly tokenUtils;
    private readonly openidStorageService;
    private refreshTokensTimer?;
    /**
     * Sets up automatic token refresh based on current token expiration.
     * @param refreshCallback Function to call when refresh is needed
     *
     * @returns Promise that resolves when setup is complete
     */
    setupTokensRefresh(refreshCallback: (refreshToken: string) => Promise<void>): Promise<void>;
    /**
     * Clears any scheduled token refresh timer.
     */
    clearRefreshTimer(): void;
    /**
     * Determines if token refresh should be set up based on refresh token validity.
     * @param refreshToken The refresh token to check
     * @returns True if refresh should be set up
     */
    shouldSetupRefresh(refreshToken: string | null): boolean;
    /**
     * Calculates delay in milliseconds until token refresh should occur.
     * @private
     * @param token The token to calculate delay for
     * @returns Delay in milliseconds
     */
    private calculateRefreshDelay;
    /**
     * Executes immediate token refresh when tokens are about to expire.
     * @private
     * @param refreshToken The refresh token to use
     * @param refreshCallback The callback function to perform the refresh
     * @returns Promise that resolves when refresh is complete
     */
    private executeImmediateRefresh;
    /**
     * Schedules token refresh to occur after specified delay.
     * @private
     * @param refreshToken The refresh token to use
     * @param delay Delay in milliseconds before refresh
     * @param refreshCallback The callback function to perform the refresh
     */
    private scheduleTokenRefresh;
}
