import { CookieOptions } from '../../models/cookie';
/**
* CookieBuilder class for constructing cookies with optional attributes (expiration, path, domain, etc.).
*/
export declare class CookieBuilder {
    private static readonly DEFAULT_PATH;
    private static readonly MILLISECONDS_PER_DAY;
    key: string;
    value: string;
    expires?: string;
    path: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    /**
     * Constructs a CookieBuilder instance with the given key, value, and options.
     *
     * @param key - The name of the cookie to set.
     * @param value - The value of the cookie to set.
     * @param [options={}] - Optional parameters for cookie settings (expiration, path, domain, etc.).
     */
    constructor(key: string, value: string, options?: CookieOptions);
    /**
     * Sets the options for the cookie.
     *
     * @param options - Object containing optional cookie settings.
     * @return Returns the current instance for method chaining.
     */
    setOptions(options: CookieOptions): this;
    /**
     * Sets the expiration date for the cookie in days.
     *
     * @param expiration - Number of days until the cookie expires.
     * @return Returns the current instance for method chaining.
     */
    setExpiration(expiration: number): this;
    /**
     * Sets the path where the cookie is available.
     *
     * @param path - The URL path for the cookie.
     * @return Returns the current instance for method chaining.
     */
    setPath(path?: string): this;
    /**
     * Sets the domain where the cookie is available.
     *
     * @param domain - The domain for the cookie.
     * @return Returns the current instance for method chaining.
     */
    setDomain(domain: string): this;
    /**
     * Marks the cookie as secure (sent over HTTPS only).
     *
     * @return Returns the current instance for method chaining.
     */
    setSecure(): this;
    /**
     * Marks the cookie as HttpOnly (inaccessible via JavaScript).
     *
     * @return Returns the current instance for method chaining.
     */
    setHttpOnly(): this;
    /**
     * Sets the SameSite attribute for the cookie.
     *
     * @param sameSite - SameSite attribute ('Strict', 'Lax', 'None').
     * @return Returns the current instance for method chaining.
     */
    setSameSite(sameSite: string): this;
    /**
     * Builds the final cookie string with all set attributes.
     *
     * @return - The complete cookie string.
     */
    build(): string;
}
