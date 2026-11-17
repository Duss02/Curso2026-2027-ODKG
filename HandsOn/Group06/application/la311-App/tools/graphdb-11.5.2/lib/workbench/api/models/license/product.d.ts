/**
 * Enum representing different product types for licensing.
 */
export declare enum Product {
    GRAPHDB_LITE = "GRAPHDB_LITE",
    GRAPHDB_SE = "GRAPHDB_SE",
    GRAPHDB_ENTERPRISE = "GRAPHDB_ENTERPRISE",
    GRAPHDB_SANDBOX = "GRAPHDB_SANDBOX"
}
export declare function toProduct(value: string): Product | undefined;
