import { JsonldExportSettings } from './jsonld-export-settings';
export declare enum ThemeMode {
    'light' = "light",
    'dark' = "dark",
    'system' = "system"
}
/**
 * Interface for legacy settings format
 */
export interface LegacySettings {
    theme: string;
    mode: string;
}
/**
 * Internal application settings model representing configurations that define the behavior and appearance of the
 * application.
 */
export declare class ApplicationSettings {
    /**
     * The theme of the application.
     */
    theme: string;
    /**
     * The theme mode of the application (e.g., light or dark).
     */
    themeMode: ThemeMode;
    jsonLdExportSettings?: JsonldExportSettings;
    constructor(data?: Partial<ApplicationSettings>);
    /**
     * Checks if the application theme is set to system mode.
     *
     * @returns true if the theme mode is set to system, false otherwise.
     */
    isSystemMode(): boolean;
    toString(): string;
}
