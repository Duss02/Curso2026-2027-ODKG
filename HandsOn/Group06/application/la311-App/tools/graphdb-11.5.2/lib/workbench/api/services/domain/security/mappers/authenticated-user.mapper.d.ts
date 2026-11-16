import { AuthenticatedUser, AuthenticatedUserResponse } from '../../../../models/security';
import { MapperFn } from '../../../../providers';
/**
 * Mapper class for converting partial AuthenticatedUser objects to complete AuthenticatedUser models.
 */
export declare const mapAuthenticatedUserResponseToModel: MapperFn<AuthenticatedUserResponse, AuthenticatedUser>;
