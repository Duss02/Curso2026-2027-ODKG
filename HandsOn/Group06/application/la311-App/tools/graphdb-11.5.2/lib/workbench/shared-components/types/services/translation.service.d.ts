import { TranslationParameter } from "../../../api/dist/ontotext-workbench-api";
import { TranslationCallback } from '../models/translation/translation-observer';
/**
 * Service responsible for translation operations in the component.
 */
declare class TranslationServiceClassDefinition {
    private currentBundle;
    private readonly defaultBundle?;
    private readonly languageContextService;
    private languageChangeSubscription;
    private translationChangedObservers;
    private readonly logger;
    constructor();
    /**
     * Translates the <code>messageLabelKey</code> with <code>translationParameter</code> and call <code>translationCallback</code> with translation of current language.
     * The <code>translationCallback</code> is called upon subscription and whenever the selected language is changed.
     *
     * @param messageLabelKey - The label key for the translation.
     * @param translationParameter - Parameters, if needed, for translation.
     * @param translationCallback - A function to be called when translating the `messageLabelKey`.
     * @returns A function that, when called, unsubscribes the provided callback from further translation updates.
     */
    onTranslate(messageLabelKey: string, translationParameter?: TranslationParameter[], translationCallback?: TranslationCallback): () => void;
    /**
     * Translates the provided key using the currently selected language by applying the parameters if
     * provided.
     * @param key The key for the label which needs to be translated.
     * @param parameters Optional parameters which to be applied during the translation.
     */
    translate(key: string, parameters?: TranslationParameter[]): string;
    /**
     * Translates a given key into the specified locale. If parameters are provided,
     * they will be applied to the translation.
     *
     * @param key - The translation key, which can be dot-separated for nested translations.
     * @param parameters - Optional parameters to be substituted into the translation string.
     * @returns The translated string with parameters applied if available, or the key itself if not found.
     */
    translateInLocale(key: string, parameters?: TranslationParameter[]): string;
    /**
     * Retrieves a translation from a specified translation bundle using the given key.
     * If the key represents a nested JSON path, it attempts to resolve the key as such.
     *
     * @param bundle - The translation bundle for the specified locale.
     * @param key - The key to translate, which may be a simple key or dot-separated for nested keys.
     * @returns The translation string if found, or `undefined` if not available.
     */
    private translateFromBundle;
    /**
     * Resolves a nested translation key by treating it as a path in a JSON object.
     * For example, if the key is "some.key.path", this method will navigate through
     * the JSON object structure to retrieve the value at that path.
     *
     * @param bundle - The translation bundle containing nested keys.
     * @param key - The dot-separated key representing the path to the translation.
     * @returns The translation string if found, or `undefined` if the path does not exist.
     */
    private translateAsJsonObject;
    /**
     * Recursively navigates through a JSON object based on a path array to retrieve
     * a translation string. Each element in the path array represents a nested key.
     *
     * @param jsonObject - The current JSON object or nested object being searched.
     * @param path - An array representing the path to the translation, where each element is a key.
     * @returns The translation string if found, or `undefined` if the path does not exist.
     */
    private getTranslation;
    private applyParameters;
    private static replaceAll;
    private notifyTranslationsChanged;
    private subscribeToBundleChange;
    destroy(): void;
}
export declare const TranslationService: TranslationServiceClassDefinition;
export {};
