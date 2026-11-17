import { AuthSettings } from '../../../../models/security/auth-settings';
import { AuthSettingsResponseModel } from '../../../../models/security/response-models/auth-settings-response-model';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
/**
 * Mapper class for converting partial AuthSettings objects to complete AuthSettings models.
 */
export declare const mapAuthSettingsResponseToModel: MapperFn<Partial<AuthSettingsResponseModel>, AuthSettings>;
