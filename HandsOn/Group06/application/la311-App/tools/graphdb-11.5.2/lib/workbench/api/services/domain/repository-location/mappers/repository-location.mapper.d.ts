import { RepositoryLocation } from '../../../../models/repository-location';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { RepositoryLocationResponse } from '../response/repository-location-response';
/**
 * A class containing functions to map various server responses to specific repository location models.
 */
export declare const mapRepositoryLocationResponseToModel: MapperFn<RepositoryLocationResponse, RepositoryLocation>;
