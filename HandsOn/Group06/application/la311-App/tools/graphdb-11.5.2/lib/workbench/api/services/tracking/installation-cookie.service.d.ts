import { Service } from '../../providers/service/service';
/**
 * Service to manage installation-specific cookies for the application.
 * It checks if a specific installation cookie exists, sets it if necessary,
 * retrieves it, or deletes it when required.
 *
 * @param {Object} CookieService - AngularJS service to manage cookies.
 * @return {Object} - Returns an object with methods to get, set, setIfAbsent, and remove installation cookies.
 */
export declare class InstallationCookieService implements Service {
    private readonly cookieService;
    private readonly timeProvider;
    /**
     * Checks if the installation cookie exists and retrieves its value.
     *
     * @return The installation cookie value if it exists, otherwise undefined.
     */
    get(): string | undefined;
    /**
     * Creates and sets an installation cookie with a specific installation ID and the current timestamp.
     * The cookie value is constructed as `version.installationId.timestamp`, and it is set to expire
     * in 400 days (based on the `INSTALLATION_COOKIE_EXPIRATION_IN_DAYS` constant).
     *
     * @param installationId - The unique installation ID to be stored in the cookie.
     */
    set(installationId: string): void;
    /**
     * Sets the installation cookie if it does not already exist.
     *
     * @param installationId - The unique installation ID to be stored in the cookie.
     */
    setIfAbsent(installationId: string): void;
    /**
     * Deletes the installation cookie by removing it from the browser.
     */
    remove(): void;
}
