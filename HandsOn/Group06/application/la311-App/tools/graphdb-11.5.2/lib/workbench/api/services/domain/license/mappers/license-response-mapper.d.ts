import { License } from '../../../../models/license';
import { LicenseResponse } from '../response/license-response';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
/**
 * Mapper for Graph DB license response. Maps the API JSON response to {@link License}
 */
export declare const mapLicenseResponseToModel: MapperFn<LicenseResponse, License>;
