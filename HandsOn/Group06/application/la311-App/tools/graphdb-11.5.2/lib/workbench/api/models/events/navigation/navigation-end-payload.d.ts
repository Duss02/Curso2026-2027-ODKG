/**
 * Represents the payload for a navigation end event.
 */
export declare class NavigationEndPayload {
    /**
     * The URL from which the navigation originated.
     *
     * @type {string | undefined}
     */
    oldUrl: string | undefined;
    /**
     * The URL to which the navigation ended.
     *
     * @type {string | undefined}
     */
    newUrl: string | undefined;
}
