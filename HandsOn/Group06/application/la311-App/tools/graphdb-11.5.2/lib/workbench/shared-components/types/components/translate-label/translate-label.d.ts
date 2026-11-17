import { TranslationParameter } from "../../../../api/dist/ontotext-workbench-api";
/**
 * The purpose of this component is to display translated literals in the DOM. A Stencil component re-renders when a prop or state changes,
 * but it may not re-render when the language changes. In such cases, this component should be used. It handles language change events
 * and re-translates the passed language and translation parameters.
 * Example of usage:
 * <code>
 *    <translate-label labelKey={item.labelKey} translationParameter={item.translationParameter}></translate-label>
 *    <translate-label labelKey="example.label></translate-label>
 * </code>
 */
export declare class TranslateLabel {
    private unsubscribeTranslationChanged;
    /**
     * The translation label key.
     */
    labelKey: string;
    /**
     * The parameters passed to the translation.
     */
    translationParameters: TranslationParameter[];
    translatedLabel: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): any;
}
