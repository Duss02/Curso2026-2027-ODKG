/**
 * Represents a wrapper of the data obtained from the storage with methods to convert it to different formats.
 */
export declare class StorageData {
    private readonly logger;
    /**
     * The value obtained from the storage.
     */
    value: string | null;
    /**
     * Creates a new instance of the StorageData class.
     * @param value The value obtained from the storage.
     */
    constructor(value: string | null);
    /**
     * Returns the value as a string or null if the value is null.
     * @returns The value as a string or null if the value is null.
     */
    getValue(): string | null;
    /**
     * Checks if the value is defined (not null or undefined).
     * @returns True if the value is defined, false otherwise.
     */
    isDefined(): boolean;
    /**
     * Returns the value as a string or the default value if the value is null.
     * @param defaultValue The default value to return if the value is null.
     * @returns The value as a string or the default value if the value is null.
     */
    getValueOrDefault(defaultValue: string): string | undefined;
    /**
     * Returns the value as a JSON object or null if the value is not a valid JSON. Conversion is done using JSON.parse.
     * @returns The value as a JSON object or null if the value is not a valid JSON.
     */
    getAsJson(): unknown;
}
