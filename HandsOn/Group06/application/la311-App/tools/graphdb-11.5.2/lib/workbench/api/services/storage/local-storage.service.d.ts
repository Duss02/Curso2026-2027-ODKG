import { StorageData } from '../../models/storage';
import { Persistence } from './persistence';
/**
 * Persistence implementation backed by the localStorage API.
 * In most cases, this class should not be used directly but extended by a service that provides additional specific
 * functionality and keys.
 */
export declare abstract class LocalStorageService implements Persistence {
    /**
     * The namespace is used to scope keys for the persistent properties by component or view. Each persistence service
     * should define a namespace to be used for the keys in the localStorage.
     */
    abstract get NAMESPACE(): string;
    /**
     * Sets the value for the given key in the localStorage.
     * Each implementation must implement this method to store the value in the localStorage by invoking the
     * LocalStorageService.storeValue method and eventually doing some additional work if needed, for example, notifying
     * other services about the change.
     * @param key The key to set the value for. Every key must be prefixed with {@link StorageKey.GLOBAL_NAMESPACE}.
     * @param value The value to set.
     */
    abstract set(key: string, value: string): void;
    /**
     * Getter for the localStorage implementation.
     */
    getStorage(): Storage;
    /**
     * Returns the value of the given key from the localStorage.
     * @param key The key to get the value for. Every key must be prefixed with {@link StorageKey.GLOBAL_NAMESPACE}.
     * @param usePrefixedKey Whether to prefix the key with the global and local namespaces before retrieving the value.
     * Obtaining unprefixed keys is generally only for migration purposes.
     * @return The value of the key wrapped in a StorageData object.
     */
    get(key: string, usePrefixedKey?: boolean): StorageData;
    /**
     * Returns the value of the given key from the localStorage parsed as JSON.
     *
     * This method is generally only for migration purposes because it does not try to prefix the provided key.
     *
     * @param key The key to get the value for.
     * @return The parsed JSON value of the key, or null if the key does not exist or parsing fails.
     */
    getAsJson<T>(key: string): T | null;
    /**
     * Stores the value for the given key in the localStorage.
     * @param key The key to set the value for. Every key must be prefixed with {@link StorageKey.GLOBAL_NAMESPACE}.
     * @param value The value to set.
     */
    storeValue(key: string, value: string): void;
    /**
     * Removes the value for the given key from the localStorage.
     * @param key The key to remove the value for. Every key must be prefixed with {@link StorageKey.GLOBAL_NAMESPACE}.
     * @param usePrefixedKey Whether to prefix the key with the global and local namespaces before removing the value.
     */
    remove(key: string, usePrefixedKey?: boolean): void;
    private getPrefixedKey;
}
