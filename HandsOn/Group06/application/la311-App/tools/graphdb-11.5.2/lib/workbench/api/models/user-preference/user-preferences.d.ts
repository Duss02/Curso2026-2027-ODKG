/**
 * Stores user-specific UI preferences.
 *
 * These preferences are persisted for authenticated users and control personalized UI behavior.
 */
export declare class UserPreferences {
    /**
     * Indicates whether the user has dismissed the Solr deprecation banner.
     * When {@code true}, the banner is not shown again for the user.
     */
    isSolrDeprecationBannerDismissed: boolean;
    /**
     * Creates a new user preferences instance.
     *
     * @param value - Optional values used to initialize the user preferences.
     */
    constructor(value?: Partial<UserPreferences>);
}
