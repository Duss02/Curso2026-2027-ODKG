import { LocalStorageService } from '../../storage';
/**
 * Service for managing autocomplete-related storage operations.
 */
export declare class AutocompleteStorageService extends LocalStorageService {
    private readonly ENABLED_KEY;
    readonly NAMESPACE = "autocomplete";
    set(key: string, value: string): void;
    /**
     * Checks if autocomplete is enabled.
     * @returns {boolean} True if autocomplete is enabled, false otherwise.
     */
    isEnabled(): boolean;
    /**
     * Sets the value of 'autocomplete.enabled' in the local store.
     * @param value - The value to set for 'autocomplete.enabled'.
     */
    setEnabled(value: boolean): void;
}
