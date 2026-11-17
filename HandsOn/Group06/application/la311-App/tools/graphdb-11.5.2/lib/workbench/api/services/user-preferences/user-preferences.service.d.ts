/**
 * Service for loading, updating, and persisting user preferences.
 *
 * Preferences are stored per current user:
 * - A currently logged-in user has an individual set of preferences.
 * - The anonymous user, used when security is disabled or free access is enabled,
 *   has a shared persisted set of preferences identified by the {@link ANONYMOUS_USER} key.
 */
export declare class UserPreferencesService {
    private static readonly ANONYMOUS_USER;
    private readonly userPreferencesStorageService;
    private readonly userPreferencesContextService;
    private readonly securityContextService;
    private readonly authenticationService;
    /**
     * Marks the Solr deprecation banner as dismissed for the current user.
     *
     * The preference is updated in the application context and persisted for the current user.
     * A currently logged-in user has individual preferences, while the anonymous user shares
     * a common persisted set of preferences.
     */
    dismissSolrDeprecationBanner(): void;
    /**
     * Checks whether the Solr deprecation banner has been dismissed by the current user.
     *
     * @returns {@code true} if the banner was dismissed, otherwise {@code false}.
     */
    isSolrDeprecationBannerDismissed(): boolean;
    /**
     * Loads the preferences for the current user into the application context.
     *
     * A currently logged-in user receives their individual persisted preferences.
     * The anonymous user receives the shared anonymous preferences.
     */
    loadUserPreferences(): void;
    /**
     * Returns the username of the current user.
     *
     * A currently logged-in user is identified by their username.
     * The anonymous user is identified by the {@link ANONYMOUS_USER} key.
     *
     * @returns The username of the current user, or {@code undefined} if the username
     * of the currently logged-in user cannot be determined.
     */
    private getCurrentUsername;
    /**
     * Loads the persisted preferences for the specified user.
     *
     * @param username - The username of the user whose preferences should be loaded.
     * @returns The persisted preferences, or {@code undefined} if no preferences exist.
     */
    private loadCurrentUserPreferences;
    /**
     * Returns the current user's preferences from the application context.
     *
     * If no preferences exist in the context, a new preferences instance is created.
     *
     * @returns The current user's preferences.
     */
    private getCurrentUserPreferences;
    /**
     * Persists the preferences for the current user.
     *
     * A currently logged-in user's preferences are stored under their username.
     * The anonymous user's preferences are stored under the {@link ANONYMOUS_USER} key.
     *
     * @param userPreferences - The current user's preferences to persist.
     */
    private persistCurrentUserPreferences;
}
