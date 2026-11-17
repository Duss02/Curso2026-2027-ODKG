import { ContextService } from '../../context';
import { DeriveContextServiceContract } from '../../../models/context/update-context-method';
import { ValueChangeCallback } from '../../../models/context/value-change-callback';
import { LifecycleHooks } from '../../../providers/service/lifecycle-hooks';
type AutocompleteContextFields = {
    readonly AUTOCOMPLETE_ENABLED: string;
};
type AutocompleteContextFieldParams = {
    readonly AUTOCOMPLETE_ENABLED: boolean;
};
/**
 * Service for managing autocomplete context state across the application.
 */
export declare class AutocompleteContextService extends ContextService<AutocompleteContextFields> implements DeriveContextServiceContract<AutocompleteContextFields, AutocompleteContextFieldParams>, LifecycleHooks {
    /**
     * Context property key for the autocomplete enabled state.
     */
    readonly AUTOCOMPLETE_ENABLED = "isAutocompleteEnabled";
    /**
     * Updates the autocomplete enabled state in the context and in the local store
     *
     * @param enabled - Boolean value indicating whether autocomplete is enabled
     */
    updateAutocompleteEnabled(enabled: boolean): void;
    /**
     * Subscribes to changes in the autocomplete enabled state.
     *
     * @param callbackFn - Callback function that will be invoked when the autocomplete enabled state changes
     * @returns A function that can be called to unsubscribe from the changes
     */
    onAutocompleteEnabledChanged(callbackFn: ValueChangeCallback<boolean | undefined>): () => void;
}
export {};
