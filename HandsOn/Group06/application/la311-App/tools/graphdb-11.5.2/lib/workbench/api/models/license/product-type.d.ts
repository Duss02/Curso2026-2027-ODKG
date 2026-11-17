/**
 * Enum representing different product types for licensing.
 */
export declare enum ProductType {
    FREE = "free",
    STANDARD = "standard",
    ENTERPRISE = "enterprise",
    SANDBOX = "sandbox"
}
export declare function toProductType(value: string): ProductType | undefined;
