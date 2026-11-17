import { LocalStorageService } from '../storage';
import { Suggestion } from '../../models/rdf-search';
/**
 * Service for managing resource search-related data in local storage.
 */
export declare class ResourceSearchStorageService extends LocalStorageService {
    private readonly SELECTED_VIEW_KEY;
    private readonly INPUT_KEY;
    private readonly LAST_SELECTED_KEY;
    NAMESPACE: string;
    private readonly LEGACY_LAST_SELECTED_KEY;
    private readonly LEGACY_INPUT_KEY;
    private readonly LEGACY_SELECTED_VIEW_KEY;
    set(key: string, value: string): void;
    /**
     * Sets the selected view type for the rdf search.
     * @param viewType - The type of view which is selected
     */
    setSelectedView(viewType: string): void;
    /**
     * Retrieves the currently selected view type for rdf search.
     * @returns {string} The current view type or an empty string if no view type is stored.
     */
    getSelectedView(): string;
    /**
     * Stores the current value of the resource search input.
     * @param value - The input value.
     */
    setInputValue(value: string): void;
    /**
     * Retrieves the stored resource search input value.
     * @returns {string} The stored input value or an empty string if no value is stored.
     */
    getInputValue(): string;
    /**
     * Stores the value of the last selected autocomplete suggestion.
     * @param suggestion - The Suggestion object that was last selected by the user.
     */
    setLastSelected(suggestion: Suggestion): void;
    /**
     * Retrieves the value of the last selected autocomplete suggestion.
     * @returns {string} The value of the last selected suggestion or an empty string if no suggestion was selected.
     */
    getLastSelectedValue(): string;
    /**
     * Clears the autocomplete search history from local storage.
     * Removes both the stored input value and the last selected suggestion.
     */
    clearStoredSearch(): void;
}
