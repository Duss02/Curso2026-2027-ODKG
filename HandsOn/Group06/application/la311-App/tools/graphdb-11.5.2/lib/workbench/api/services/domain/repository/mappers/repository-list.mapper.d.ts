import { RepositoryList } from '../../../../models/repositories';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { RepositoryListResponse } from '../response/repository-response';
/**
 * Maps server response data to a {@link RepositoryList} model.
 *
 * This mapper processes repository data grouped by location into a flat list of {@link Repository}
 * instances wrapped in a {@link RepositoryList}.
 */
export declare const mapRepositoryListResponseToModel: MapperFn<RepositoryListResponse, RepositoryList>;
