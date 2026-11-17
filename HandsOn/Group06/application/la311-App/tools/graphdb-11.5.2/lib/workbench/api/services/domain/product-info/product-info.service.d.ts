import { Service } from '../../../providers/service/service';
import { ProductInfo } from '../../../models/product-info';
/**
 * Service responsible for retrieving and managing product information.
 */
export declare class ProductInfoService implements Service {
    private readonly productInfoRestService;
    /**
     * Retrieves the local version information of the product.
     *
     * This function fetches the local version data from the license REST service
     * and maps the response to a ProductInfo model object.
     *
     * @returns {Promise<ProductInfo>} A Promise that resolves to a ProductInfo object
     * containing the local version information of the product.
     */
    getProductInfoLocal(): Promise<ProductInfo>;
}
