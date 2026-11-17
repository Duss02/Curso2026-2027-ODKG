import { Service } from '../../providers/service/service';
import { ThemeMode } from '../../models/application-settings';
/**
 * Service to manage the theme of the application.
 */
export declare class ThemeService implements Service {
    private readonly applicationSettingsStorageService;
    private readonly runtimeConfigurationContextService;
    private readonly rootSelector;
    private readonly darkClass;
    /**
     * Code editors theme name used in dark mode.
     */
    static readonly CODE_EDITOR_DARK_THEME = "moxer";
    /**
     * Applies the theme based on the saved application settings.
     */
    applyDarkModeIfEnabled(): void;
    /**
     * Determines the current theme mode to be applied in the application. The method checks if the user has manually set
     * a theme mode in the application settings. If a theme mode is set, it returns that mode (dark, light, or system). If no theme
     * mode is set by the user, it falls back to the system's preferred color scheme, returning dark or light based on the
     * user's system settings.
     * @returns The current theme mode to be applied in the application.
     */
    getCurrentThemeMode(): ThemeMode;
    /**
     * Explicitly sets the theme mode.
     * @param mode The desired theme mode.
     */
    setThemeMode(mode: ThemeMode): void;
    /**
     * Applies the color scheme to the application based on system preferences and saved settings.
     * If the user has not manually chosen a theme, the method applies the system's preferred color scheme (dark or light
     * mode). If the user has previously set a theme in the application settings, that preference takes precedence and is
     * applied instead.
     */
    applyColorScheme(): void;
    /**
     * Applies a new color scheme based on the user's preference. Updates the system theme mode in the context
     * The theme will only be updated if the user has not manually chosen a theme.
     * @param newTheme The new theme mode based on the user's preference.
     */
    applyNewColorScheme(newTheme: ThemeMode): void;
    /**
     * Returns the stored theme mode, or {@link ThemeMode.system} when nothing has been persisted yet.
     * Use this to initialise UI controls that need a concrete selection including the system option.
     */
    getThemeModeOrSystem(): ThemeMode;
    /**
     * Checks if the current theme mode is set to dark.
     *
     * @returns `true` if the current theme mode is set to system.
     */
    isSystemThemeMode(): boolean;
    /**
     * Checks whether dark mode is currently applied on the document.
     *
     * @returns `true` if the dark mode is applied, `false` otherwise.
     */
    isDarkModeApplied(): boolean;
    /**
     * @returns `true` if dark mode is enabled in the saved settings.
     */
    isDarkModeEnabledInSettings(): boolean;
    /**
     * @returns `true` if the theme mode is set in the saved settings.
     */
    isThemeModeSet(): boolean;
    /**
     * @returns {string | undefined} the theme name to be used in the code editor.
     */
    getCodeEditorThemeName(): string | undefined;
    getPreferredScheme(): ThemeMode;
    /**
     * @return the root `:root` element.
     */
    private getRootElement;
}
