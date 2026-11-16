/**
 * OntoRdfSearch component for RDF resource search.
 * This component is responsible for showing/hiding the search menu in the header
 */
export declare class OntoRdfSearch {
    private readonly subscriptions;
    private readonly eventService;
    private readonly resourceSearchStorageService;
    private readonly RDF_CONTEXT;
    private isOpen;
    private buttonConfig;
    private redirectUrl;
    private rdfSearchRef;
    /**
     * Handles click events on the window.
     * Closes the search area if it's open and the click is outside the search area.
     * @param event - The MouseEvent object.
     */
    handleClick(event: MouseEvent): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    componentDidRender(): void;
    componentDidLoad(): void;
    render(): any;
    /**
     * Creates a function to set the open state of the search area.
     * @param isOpen - Boolean indicating whether the search area should be open.
     */
    private setIsOpen;
    /**
     * Creates the configuration for search buttons.
     * @returns A SearchButtonConfig object with radio buttons for table and visual search.
     */
    private createButtonConfig;
    /**
     * Creates a search button with the given parameters.
     * @param id - The id for the button.
     * @param labelKey - The key for the button's label translation.
     * @param callback - The function to be called when the button is clicked.
     * @param selected - Boolean indicating whether the button should be initially selected.
     * @returns A SearchButton object.
     */
    private createSearchButton;
    private onSuggestionSelected;
    private onKeyDown;
    private focusSearchInput;
    private loadSelectedViewFromStorage;
}
