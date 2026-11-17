import { AvailableLanguagesList } from './available-languages-list';
import { Model } from '../common';
export declare const DEFAULT_LANGUAGE = "en";
export declare const SUPPORTED_LANGUAGES: string[];
/**
 * Represents the configuration for language settings in the application.
 */
export declare class LanguageConfig extends Model<LanguageConfig> {
    readonly languageBundleVersion: string;
    readonly defaultLanguage: string;
    readonly availableLanguages: AvailableLanguagesList;
    constructor(props: Partial<LanguageConfig>);
}
