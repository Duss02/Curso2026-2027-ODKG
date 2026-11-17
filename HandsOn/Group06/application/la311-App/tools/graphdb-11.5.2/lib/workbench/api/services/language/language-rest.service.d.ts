import { HttpService } from '../http/http.service';
import { TranslationBundle } from '../../models/language';
import { LanguageConfigResponse } from './response/language-config-response';
/**
 * Service for handling language-related REST operations.
 */
export declare class LanguageRestService extends HttpService {
    private readonly I18N_ENDPOINT;
    /**
     * Retrieves the translation bundle for a specific language.
     *
     * @param languageCode - The code of the language for which to fetch translations.
     * @param languageBundleVersion - A language bundle version identifier used for cache busting
     * @returns A Promise that resolves to a TranslationBundle containing the translations for the specified language.
     */
    getLanguage(languageCode: string, languageBundleVersion?: string): Promise<TranslationBundle>;
    /**
     * Fetches the language configuration for the application.
     *
     * @returns A Promise that resolves to a {@link LanguageConfigResponse} object containing the language configuration settings.
     */
    getLanguageConfiguration(): Promise<LanguageConfigResponse>;
}
