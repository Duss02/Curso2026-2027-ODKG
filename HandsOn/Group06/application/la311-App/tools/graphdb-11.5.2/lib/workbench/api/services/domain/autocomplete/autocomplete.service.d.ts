import { Service } from '../../../providers/service/service';
import { AutocompleteSearchResult } from '../../../models/rdf-search';
/**
 * Service responsible for handling autocomplete functionality in the RDF search.
 */
export declare class AutocompleteService implements Service {
    private readonly autocompleteRestService;
    /**
     * Performs an autocomplete search based on the provided search term.
     * This method fetches autocomplete suggestions from the REST service and maps
     * the results to the AutocompleteSearchResult.
     *
     * @param searchTerm - The string to use as the basis for autocomplete suggestions
     * @param signal - Optional AbortSignal to cancel the request if needed.
     * @returns A promise that resolves to an AutocompleteSearchResult containing the matching suggestions
     */
    search(searchTerm: string, signal?: AbortSignal): Promise<AutocompleteSearchResult>;
    /**
     * Checks if the autocomplete functionality is enabled.
     *
     * This method queries the AutocompleteRestService to determine
     * whether the autocomplete feature is currently enabled.
     *
     * @returns A promise that resolves to a boolean value.
     */
    isAutocompleteEnabled(): Promise<boolean>;
}
