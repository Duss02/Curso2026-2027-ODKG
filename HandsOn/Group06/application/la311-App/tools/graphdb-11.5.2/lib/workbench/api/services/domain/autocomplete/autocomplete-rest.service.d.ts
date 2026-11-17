import { HttpService } from '../../http/http.service';
import { AutocompleteSearchResultResponse } from './response/autocomplete-search-result-response';
/**
 * Service for handling autocomplete REST operations.
 */
export declare class AutocompleteRestService extends HttpService {
    private readonly autocompleteRestPrefix;
    /**
     * Performs an autocomplete search based on the provided search term.
     *
     * @param searchTerm - The string to use for autocomplete search.
     * @param signal - Optional AbortSignal to cancel the request if needed.
     * @returns A Promise that resolves to an AutocompleteSearchResult object containing search suggestions.
     */
    search(searchTerm: string, signal?: AbortSignal): Promise<AutocompleteSearchResultResponse>;
    /**
     * Checks if the autocomplete feature is enabled.
     *
     * @returns A Promise that resolves to a boolean indicating whether autocomplete is enabled.
     */
    enabled(): Promise<boolean>;
}
