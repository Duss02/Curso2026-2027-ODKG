/**
 * Utility class for converting between byte values and human-readable size strings.
 */
export declare class ByteUtils {
    /**
     * Converts the given `size` to bytes as a number.
     *
     * The `size` parameter can be passed in the following forms:
     * - As a number, e.g., `123`, `432`, etc.
     * - As a string representing a number, e.g., `"123"`, `"432"`, etc.
     * - As a human-readable string with units, e.g., `"123 bytes"`, `"432 KB"`, etc.
     *
     * @param size - The size to convert.
     * @returns The size in bytes. Returns `0` if the input is invalid.
     */
    static convertToBytes(size: number | string | undefined | null): number;
    /**
     * Converts the given `size` in bytes to a human-readable string.
     *
     * If the size is already a human-readable string, it will be returned as-is.
     *
     * @param size - The size in bytes to convert. Can be a number or a string.
     * @returns A human-readable size string, e.g., `"1.50 KB"`, `"100 MB"`.
     *          Returns `"0 bytes"` if the input is invalid or less than or equal to `0`.
     */
    static convertToHumanReadable(size: number | string | null | undefined): string;
}
