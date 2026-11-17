import { SearchButtonConfig } from "../../../../api/dist/ontotext-workbench-api";
/**
 * A component for rendering RDF search resource input with configurable buttons.
 * This component provides a text input for search queries and a set of configurable buttons.
 */
export declare class OntoSearchResourceInput {
    private readonly autocompleteService;
    private readonly autocompleteContextService;
    private readonly autocompleteStorageService;
    private readonly resourceSearchStorageService;
    private readonly toastrService;
    private readonly eventService;
    private readonly namespaceContextService;
    private readonly subscriptions;
    private autocompleteWarningShown;
    private inputRef;
    private namespaces;
    /**
     * The search resource component can appear more than once per page. This context
     * is used to differentiate them. When a suggestion is selected different parents
     * may need to do different things. The context is emitted alongside the suggestion
     * upon select.
     */
    context: string;
    /** Whether the rdf resource pre-search validation should be skipped. */
    skipValidation: boolean;
    /**
     * Whether to preserve the input value and last selected suggestion
     * If true, both will be stored in local storage and loaded, when the component is rendered
     */
    preserveSearch: boolean;
    /**
     * Whether the search component is currently hidden. Can be shown/hidden in the RDF search
     */
    isHidden: boolean;
    onVisibilityChange(isHidden: boolean): void;
    /**
     * Button configuration for the search resource input.
     * Holds buttons to be displayed, as well as additional configuration,
     * such as whether the buttons should be treated as radio buttons.
     */
    buttonConfig: SearchButtonConfig;
    /**
     * The current value of the search input field.
     */
    private inputValue;
    /**
     * The current autocomplete search result
     */
    private searchResult;
    /**
     * Whether the autocomplete setting is enabled.
     */
    private isAutocompleteEnabled;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): any;
    /**
     * Handles the click event for a search button.
     * If the button configuration is set to radio mode and the clicked button is not selected,
     * it deselects all other buttons and selects the clicked one.
     * @param {SearchButton} button - The button that was clicked.
     */
    private handleButtonClick;
    /**
     * Updates the local inputValue with the html input element's value.'
     */
    private readonly handleInput;
    private loadAutocompleteResults;
    /**
     * Clears the search input field.
     */
    private readonly clearInput;
    private hoverSuggestion;
    private onAutocompleteEnabledChange;
    private checkForAutocomplete;
    private onSuggestionClick;
    private searchRdfResource;
    private notifyRdfResourceSelected;
    private expandPrefix;
    private setInputValue;
    private onNamespaceChange;
    private readonly onKeyDown;
    private onEnter;
    private onArrowUp;
    private onArrowDown;
    private displaySuggestion;
    private getSuggestionValue;
    private scrollToSuggestionBySelector;
    private validateAndSearch;
    private onEscape;
    private loadInputFromStorage;
    private onResultsReceived;
}
