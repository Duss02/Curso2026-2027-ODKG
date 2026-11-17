import { Service } from '../../providers/service/service';
import { CookieStore } from './cookie-store';
/**
 * Service to manage cookies for the application.
 */
export declare class CookieService implements Service {
    private readonly store;
    constructor(store?: CookieStore);
    /**
     * Retrieves the value of a cookie by its key.
     *
     * @param key - The name of the cookie to retrieve.
     * @return The value of the cookie, or `undefined` if the cookie doesn't exist.
     */
    get(key: string): string | undefined;
    /**
     * Sets a cookie with the given key, value, and options.
     *
     * @param key - The name of the cookie to set.
     * @param value - The value of the cookie to set.
     * @param [options={}] - Optional parameters for cookie settings.
     */
    set(key: string, value: string, options?: {}): void;
    /**
     * Deletes a cookie by setting an expired date, effectively removing it from the browser.
     *
     * @param key - The name of the cookie to delete.
     */
    remove(key: string): void;
    /**
     * Retrieves all cookies.
     *
     * @return - An object containing all cookies as key-value pairs.
     */
    getAll(): Record<string, string>;
    /**
     * Parses the document's cookie string and returns an object containing all cookies as key-value pairs.
     *
     * @return - An object where each key is a cookie name and each value is the corresponding cookie value.
     */
    parseCookies(): Record<string, string>;
}
