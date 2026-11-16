import { MapperFn } from '../../../../providers';
import { SavedQueryListResponse } from '../response/saved-query-response';
import { SavedQueryList } from '../../../../models/sparql';
/**
 * Maps the response from the API to the SavedQueryList model.
 * @param data The response from the API, expected to be an array of saved queries.
 * @returns A SavedQueryList instance containing the mapped saved queries.
 */
export declare const mapSavedQueryListResponseToModel: MapperFn<SavedQueryListResponse, SavedQueryList>;
