type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
export declare class ObjectUtil {
    /**
     * Performs a deep equality check between two values.
     *
     * This function compares two values to determine if they are deeply equal.
     * It supports comparison of primitives, arrays, and objects, including nested structures.
     *
     * @param obj1 - The first value to compare.
     * @param obj2 - The second value to compare.
     * @returns `true` if both values are deeply equal, otherwise `false`.
     *
     * @example
     * // Comparing two deeply nested objects
     * const obj1 = { a: 1, b: { c: [1, 2, 3], d: { e: 'hello' } } };
     * const obj2 = { a: 1, b: { c: [1, 2, 3], d: { e: 'hello' } } };
     * console.log(deepEqual(obj1, obj2)); // true
     *
     * @example
     * // Comparing two arrays with different values
     * const arr1 = [1, 2, 3];
     * const arr2 = [1, 2, 4];
     * console.log(deepEqual(arr1, arr2)); // false
     */
    static deepEqual(obj1: unknown, obj2: unknown): boolean;
    /**
     * Creates a deep copy of the given object.
     *
     * This method recursively copies all properties and values of the object,
     * handling different types such as primitives, arrays, plain objects, and built-in types.
     * It ensures that the copied object does not share references with the original object,
     * meaning that all nested structures are also copied independently.
     *
     * Special handling:
     * - Objects with a `copy()` method will use that method for cloning
     * - Date objects are cloned preserving their time value
     * - RegExp objects are cloned with their pattern and flags
     * - Map and Set objects are deeply cloned with their contents
     * - Arrays are deeply cloned with all elements
     * - Plain objects are recursively cloned
     *
     * @param obj - The object to be deeply copied. Can be any type, including primitives,
     *              arrays, objects, or built-in types.
     * @returns A deep copy of the object. If the input is a primitive, null, undefined,
     *          or a function, the original value is returned as-is.
     */
    static deepCopy(obj: unknown): unknown;
    /**
     * Attempts to copy built-in types like Array, Date, RegExp, Map, and Set.
     * @param obj - The object to copy.
     * @returns A copy of the object if it's a built-in type, or null if it's not a recognized built-in type.
     */
    private static copyBuiltInType;
    /**
     * Creates a deep copy of a plain object.
     * @param obj - The object to copy.
     * @returns A deep copy of the object.
     */
    private static copyPlainObject;
    /**
     * Type guard to check if the value has a 'copy' method.
     * @param value - The value to check.
     * @returns True if the value has a 'copy' method, false otherwise.
     */
    static hasCopyMethod(value: unknown): boolean;
    /**
     * Checks if the given object is null or undefined.
     * @param obj - The object to check.
     * @returns True if the object is null or undefined, false otherwise.
     */
    static isNullOrUndefined: (obj: unknown) => boolean;
    /**
     * Merges an object with default values.
     *
     * For each property in `defaults`, if the value in `object` is `null` or `undefined`,
     * the default value is used instead.
     *
     * Nested objects are merged recursively.
     * Arrays and other non-plain values are treated as single values and are not merged.
     *
     * The returned object is a new object and does not share references with the inputs.
     *
     * @template T - The shape of the object being merged
     * @param object - Source object whose values take precedence over defaults
     * @param defaults - Default values applied when properties are missing or null
     * @returns A new object containing the merged result
     *
     * @example
     * ObjectUtil.mergeWithDefaults(
     *   { a: 1 },
     *   { a: 10, b: 20 }
     * );
     * // { a: 1, b: 20 }
     */
    static mergeWithDefaults<T>(object: T, defaults: DeepPartial<T>): T;
    /**
     * Determines whether two values can be recursively merged.
     *
     * Only plain objects (non-null, non-array values) are considered mergeable.
     *
     * @param a - First value to check
     * @param b - Second value to check
     * @returns True if both values are plain objects suitable for deep merging
     */
    private static canRecursivelyMerge;
}
export {};
