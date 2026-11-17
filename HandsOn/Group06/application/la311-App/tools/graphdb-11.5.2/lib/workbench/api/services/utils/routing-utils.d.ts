/**
 * Redirects the current page to a specified URL using the single-spa framework.
 * Made to be used from views. If you are not navigating from a view, use <code>navigate</code> instead
 *
 * @param url - The target URL to which the page should be redirected.
 */
export declare function navigateTo(url: string): (event?: Event) => void;
/**
 * Navigates to the specified URL using the single-spa framework.
 * Suitable for in-code navigation. If you need to navigate from a view, use <code>navigateTo</code> instead.
 * @param targetUrl - The target URL to which the page should be redirected.
 */
export declare function navigate(targetUrl: string): void;
/**
 * Opens a new tab with the specified URL.
 * @param url - The URL to open in a new tab.
 */
export declare function openInNewTab(url: string): void;
/**
 * Checks if the current page is the home page.
 *
 * @returns Returns true if the current page is the home page, false otherwise.
 */
export declare function isHomePage(): boolean;
/**
 * Checks if the current page is the login page.
 *
 * @returns Returns true if the current page is the login page, false otherwise.
 */
export declare function isLoginPage(): boolean;
/**
 * Retrieves the pathname portion of the current URL without the context prefix.
 *
 * @returns The pathname of the current URL, which represents the path segment that comes after the context (if any) and before the query string.
 */
export declare function getPathName(): string;
/**
 * Retrieves the current URL including the context prefix, if present.
 *
 * @returns The current URL including the context prefix.
 */
export declare function getOrigin(): string;
/**
 * Returns the context name (base href) from the `<base>` tag in the document.
 *
 * This is usually the base path under which the app is deployed, e.g. '/graphdb/'.
 * If no `<base>` tag is found, returns '/' by default.
 *
 * @returns The context path as specified in the base href (always ending with a slash).
 */
export declare function getBasePath(): string;
/**
 * Retrieves the current route from the URL, removing the leading <code>/</code>.
 * For example:<br>
 * Calling <code>getCurrentRoute()</code> while on http://localhost:9000/sparql will return <code>"sparql"</code><br>
 * Calling <code>getCurrentRoute()</code> while on http://localhost:9000/graphql/endpoints will return <code>"graphql/endpoints"<code>
 */
export declare function getCurrentRoute(): string;
/**
 * Retrieves the current URL path along with any query parameters.
 *
 * @returns The current URL path combined with its query parameters, if any.
 */
export declare function getLocationPathWithQueryParams(): string;
