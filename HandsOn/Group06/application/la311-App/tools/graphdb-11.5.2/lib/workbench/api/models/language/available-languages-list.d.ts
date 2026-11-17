import { AvailableLanguage } from './available-language';
/**
 * Represents a list of available languages.
 */
export declare class AvailableLanguagesList {
    readonly languages: AvailableLanguage[];
    constructor(languages?: AvailableLanguage[]);
    /**
     * Retrieves an array of language codes from the available languages.
     *
     * This method maps over the list of available languages and extracts
     * the 'key' property from each language object, which represents
     * the language code.
     *
     * @returns {string[]} An array of language codes (e.g., ['en', 'fr', 'de']).
     */
    getLanguageCodes(): string[];
}
