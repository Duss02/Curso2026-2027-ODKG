import { DropdownItemAlignment } from '../../models/dropdown/dropdown-item-alignment';
export declare class OntoLanguageSelector {
    private readonly languageService;
    private readonly languageContextService;
    private items;
    private onLanguageChangeSubscription;
    /**
     * Specifies the dropdown items' alignment. If not provided, the items and the dropdown button will be aligned to the left.
     *
     */
    dropdownAlignment: DropdownItemAlignment;
    /**
     * Holds the currently selected language, such as 'en' or 'fr'.
     */
    currentLanguage: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): any;
    private valueChangeHandler;
    private changeLanguage;
    private onSelectedLanguageChanged;
    private getLanguageDropdownOptions;
}
