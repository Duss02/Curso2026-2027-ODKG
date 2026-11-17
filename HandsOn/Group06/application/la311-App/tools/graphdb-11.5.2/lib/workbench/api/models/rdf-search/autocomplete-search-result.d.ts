import { Model } from '../common';
import { SuggestionList } from './suggestion-list';
import { Suggestion } from './suggestion';
/**
 * Represents an RDF search result containing suggestions.
 */
export declare class AutocompleteSearchResult extends Model<AutocompleteSearchResult> {
    /** The list of suggestions associated with this search result. */
    suggestions: SuggestionList;
    constructor(data: SuggestionList);
    /**
     * Sets the hovered state of the first suggestion to true, if present.
     */
    hoverFirstSuggestion(): AutocompleteSearchResult | undefined;
    /**
     * Sets the hovered state of the specified suggestion to true.
     * @param suggestion - The suggestion to be highlighted.
     */
    hoverSuggestion(suggestion: Suggestion): AutocompleteSearchResult;
    /**
     * Sets the selected state of the specified suggestion to true.
     * Clears the selected state of all other suggestions before selecting the new one.
     * If the suggestion is already selected or is null/undefined, no action is taken.
     *
     * @param suggestion - The suggestion to be selected.
     */
    selectSuggestion(suggestion: Suggestion): AutocompleteSearchResult;
    /**
     * Returns the selected suggestion from the list, if any.
     * @return The selected suggestion, or undefined if no suggestion is selected.
     */
    getHoveredSuggestion(): Suggestion | undefined;
    /**
     * Moves the hover state to the previous suggestion in the list.
     * If the currently hovered suggestion is the first one or no suggestion is hovered,
     * no action is taken.
     */
    hoverPreviousSuggestion(): AutocompleteSearchResult;
    /**
     * Moves the hover state to the next suggestion in the list.
     * If the currently hovered suggestion is the last one or no suggestion is hovered,
     * no action is taken.
     */
    hoverNextSuggestion(): AutocompleteSearchResult;
    /**
     * Clears the selected state of all suggestions.
     */
    clearSuggestions(): AutocompleteSearchResult;
    /**
     * Finds a suggestion by its value.
     * @param value - The value of the suggestion to find.
     * @returns The suggestion with the specified value, or undefined if not found.
     */
    getByValue(value: string): Suggestion | undefined;
    private clearSelectedState;
    /**
     * Sets the hovered state of all suggestions to false.
     */
    private clearHoveredState;
}
