/**
 * Utility class for date-related operations.
 */
export declare class DateUtil {
    /**
     * Returns the current timestamp in milliseconds since the Unix epoch.
     *
     * @return The current timestamp in milliseconds.
     */
    static now(): number;
    /**
     * Converts a duration in seconds to a human-readable string (e.g. `"1d 2h 3m 4s"`).
     * Leading zero components are omitted. Returns `"-"` for falsy or non-positive input.
     */
    static formatDuration(s: number): string;
}
