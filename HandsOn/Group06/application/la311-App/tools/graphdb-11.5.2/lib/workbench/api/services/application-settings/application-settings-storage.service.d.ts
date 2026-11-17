import { LocalStorageService } from '../storage';
import { ApplicationSettings, ThemeMode } from '../../models/application-settings/application-settings';
import { JsonldExportSettings } from '../../models/application-settings/jsonld-export-settings';
/**
 * Service to manage the storage of application settings in the local storage.
 */
export declare class ApplicationSettingsStorageService extends LocalStorageService {
    readonly NAMESPACE = "application";
    readonly SETTINGS = "settings";
    private readonly logger;
    /**
     * Key used in previous versions to store workbench settings.
     */
    private readonly OLD_SETTINGS_KEY;
    /**
     * Migrates old application settings from previous versions to the new format.
     */
    migrate(): void;
    set(key: string, value: string): void;
    /**
     * Saves the application settings to the local storage.
     * @param settings The application settings to save.
     */
    setApplicationSettings(settings: Partial<ApplicationSettings>): void;
    /**
     * Retrieves the application settings from the local storage.
     * This method always returns an instance of `ApplicationSettings`, providing default values if no settings are found.
     * @returns The application settings.
     */
    getApplicationSettings(): ApplicationSettings;
    /**
     * Retrieves the theme mode from the application settings.
     * @returns The theme mode.
     */
    getThemeMode(): ThemeMode;
    /**
     * Retrieves the theme mode from the application settings in the local storage. Doesn't assign
     * default values.
     * @returns The theme mode from the store.
     */
    getThemeModeRaw(): ThemeMode | undefined;
    /**
     * Checks whether the theme mode is present in the application settings persisted in local storage.
     * This method doesn't use the `getApplicationSettings` to avoid returning default values.
     * @returns `true` if the theme mode is present, `false` otherwise.
     */
    isThemeModePresent(): boolean;
    getJsonLDExportSettings(): JsonldExportSettings | undefined;
    setJsonLDExportSettings(jsonLdExportSettings: JsonldExportSettings): void;
}
