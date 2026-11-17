import { ProductInfo } from '../../../../models/product-info';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { ProductInfoResponse } from '../response/product-info-response';
/**
 * Mapper class for ProductInfo objects.
 *
 * This class extends the generic Mapper class, specializing in mapping
 * partial ProductInfo data to complete ProductInfo models.
 */
export declare const mapProductInfoResponseToModel: MapperFn<ProductInfoResponse, ProductInfo>;
