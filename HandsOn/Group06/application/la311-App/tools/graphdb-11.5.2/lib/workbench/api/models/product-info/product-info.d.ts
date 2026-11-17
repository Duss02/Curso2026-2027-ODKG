export declare class ProductInfo {
    workbench: string;
    productType: string;
    productVersion: string;
    sesame: string;
    connectors: string;
    ontop: string;
    shortVersion: string;
    constructor(data: Omit<ProductInfo, 'shortVersion'>);
    private resolveShortVersion;
}
