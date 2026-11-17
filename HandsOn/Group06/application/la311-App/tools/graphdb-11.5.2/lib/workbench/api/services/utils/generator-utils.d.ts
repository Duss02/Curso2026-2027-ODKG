/**
 * Utility class for generating various values.
 */
export declare class GeneratorUtils {
    /**
     * Generates a pseudo random UUID (Universally Unique Identifier).
     *
     * This method creates a version 4 UUID, which is based on random numbers.
     * The generated UUID follows the RFC 4122 standard format.
     *
     * @returns A string representing the randomly generated UUID in the format
     * 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' where x is any hexadecimal digit
     * and y is one of 8, 9, a, or b.
     */
    static uuid(): string;
    /**
     * Generates a cryptographically secure random string of the specified length.
     *
     * @param {number} length - The desired length of the random string.
     * @returns {string} A hexadecimal string generated from secure random values.
     */
    static generateRandomString(length: number): string;
    /**
     * Returns a hash code from a string
     * @param  {String} str The string to hash.
     * @return {Number}    A 32bit integer
     */
    static hashCode(str: string): number;
}
