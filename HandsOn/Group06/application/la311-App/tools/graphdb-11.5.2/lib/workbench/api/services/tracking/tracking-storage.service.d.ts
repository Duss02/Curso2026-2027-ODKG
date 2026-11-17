import { LocalStorageService } from '../storage';
import { CookieConsent } from '../../models/tracking';
export declare class TrackingStorageService extends LocalStorageService {
    readonly NAMESPACE = "tracking";
    readonly COOKIE_CONSENT = "cookieConsent";
    readonly LEGACY_COOKIE_CONSENT = "cookie-consent";
    private readonly logger;
    /**
     * Stores a value in the local storage under a key that is prefixed with the service's namespace to avoid collisions.
     * @param key The key under which to store the value (without namespace prefix).
     * @param value The value to store as a string.
     */
    set(key: string, value: string): void;
    /**
     * Saves the user's cookie consent preferences to local storage. The preferences are serialized as a JSON string.
     * @param cookieConsent The cookie consent preferences to save, provided as a partial object. Only the specified
     * properties will be updated in storage.
     */
    setCookieConsent(cookieConsent: Partial<CookieConsent>): void;
    /**
     * Retrieves the user's cookie consent preferences from local storage. If legacy data is found under the old key, it
     * will be migrated to the new key and returned. If no data is found, null is returned.
     * @return The user's cookie consent preferences, or null if no preferences are stored.
     */
    getCookieConsent(): CookieConsent | null;
    private migrateLegacyCookieConsent;
}
