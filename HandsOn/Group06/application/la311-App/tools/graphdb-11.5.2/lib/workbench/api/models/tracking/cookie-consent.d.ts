/**
 * Represents the user's consent for various types of cookies.
 */
export declare class CookieConsent {
    /** Indicates whether the cookie policy has been accepted. */
    policyAccepted?: boolean;
    /** Indicates consent for statistical cookies. */
    statistic?: boolean;
    /** Indicates consent for third-party cookies. */
    thirdParty?: boolean;
    /** Epoch timestamp of last update in seconds. */
    updatedAt?: number;
    constructor(data?: Partial<CookieConsent>);
    /**
     * Checks if the cookie consent status has been explicitly set by the user.
     * @return true if the policyAccepted property is defined, false otherwise.
     */
    hasChanged(): boolean;
    /**
     * Predefined default: policy not accepted, but statistic and third-party cookies are allowed.
     * Equivalent to: new CookieConsent(undefined, true, true)
     * @return A new CookieConsent instance with policyAccepted undefined, statistic true, and thirdParty true.
     */
    static NOT_ACCEPTED_WITH_TRACKING(): CookieConsent;
    /**
     * Predefined default: policy accepted, no statistic or third-party cookies allowed.
     * Equivalent to: new CookieConsent(true, false, false)
     * @return A new CookieConsent instance with policyAccepted true, statistic false, and thirdParty false.
     */
    static ACCEPTED_NO_TRACKING(): CookieConsent;
    /**
     * Creates a CookieConsent instance from a JSON object.
     * If values are missing in the JSON object, they will remain undefined.
     *
     * @param json - The JSON object to initialize the CookieConsent instance.
     * @return A new CookieConsent instance with values set from the JSON object.
     */
    static fromJSON(json: Partial<CookieConsent>): CookieConsent;
}
