import { RepositoryLocation } from '../../../models/repository-location';
import { Service } from '../../../providers/service/service';
/**
 * The RepositoryLocationService class is responsible for fetching repository-location-related data from the backend
 * and mapping the responses to application models.
 */
export declare class RepositoryLocationService implements Service {
    private readonly locationRestService;
    constructor();
    /**
     * Retrieves the current repository location.
     *
     * @returns A promise resolving to the active repository location.
     */
    getActiveRepositoryLocation(): Promise<RepositoryLocation>;
}
