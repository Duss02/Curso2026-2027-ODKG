import { ValueChangeCallback } from './value-change-callback';
import { BeforeChangeValidationPromise } from './before-change-validation-promise';
/**
 * ValueContext is a generic class for managing a value of type T. It provides functionality to set and retrieve the value,
 * as well as to subscribe to changes in the value through callback functions.
 *
 * This class ensures that the value is only updated when it changes (based on a deep equality check),
 * and subscribers are notified with a copy of the updated value if it's an object, or the value itself if it's a primitive.
 *
 * @template T - The type of the value being managed. It can be any type, including primitives and objects.
 */
export declare class ValueContext<T> {
    private value;
    private callbackFunctions;
    private beforeChangeValidationPromises;
    private afterValueChangeCallbackFunctions;
    /**
     * Sets the value of the context. If the new value is different from the current value
     * (determined using a deep equality check), the value is updated and all subscribed
     * callback functions are notified.
     *
     * @param value - The new value to set for the context. If the new value differs from the current value,
     * the context is updated, and subscribers are notified.
     */
    setValue(value: T): void;
    /**
     * Retrieves the current value of the context.
     * If the value is an object, a deep copy is returned to ensure immutability.
     * For primitives, the value itself is returned.
     *
     * @returns The current value, or `undefined` if no value is set.
     */
    getValue(): T | undefined;
    /**
     * Registers a <code>ValueChangeCallback</code> to be notified when the value changes. The callback function will be called
     * whenever the value is updated, and it will receive the updated value.
     *
     * Optionally, a <code>BeforeChangeValidationPromise</code> function can be provided to validate value changes before they occur.
     * This validation will be checked during the value update execution.
     *
     * This method returns a function to unsubscribe both the callback and validation promise,
     * which can be called to stop receiving updates and remove the validation.
     *
     * @param callbackFunction - The callback function to subscribe, which will be invoked with the updated
     *                           value of type T whenever the value changes.
     * @param beforeChangeValidationPromise - Optional validation function that returns a promise resolving to
     *                                        a boolean indicating whether a value change should be allowed.
     * @param afterChangeCallback - Optional function called after value is updated.
     * @returns A function to unsubscribe both the callback and validation promise, removing them from their respective lists.
     */
    subscribe(callbackFunction: ValueChangeCallback<T | undefined>, beforeChangeValidationPromise?: BeforeChangeValidationPromise<T>, afterChangeCallback?: ValueChangeCallback<T | undefined>): () => void;
    /**
     * Checks if the provided value can be used to update the context by validating it against all registered
     * validation promises.
     *
     * This method executes all registered validation functions asynchronously and returns true only if all
     * validation functions approve the update. If any validation fails or throws an error, the update is
     * considered invalid.
     *
     * @param value - The value to validate before updating the context.
     * @returns A promise that resolves to true if all validation functions approve the update, false otherwise.
     */
    canUpdate(value: T): Promise<boolean>;
    /**
     * Creates a deep copy of the given value if it's an object. For primitives, the value itself is returned.
     *
     * @param value - The value to copy.
     * @returns A deep copy of the value if it's an object, or the value itself if it's a primitive.
     */
    private getCopy;
}
