import { Service } from '../../../providers/service/service';
import { Repository, RepositoryList, RepositorySizeInfo } from '../../../models/repositories';
/**
 * Service responsible for handling operations related to repositories domain.
 */
export declare class RepositoryService implements Service {
    private readonly repositoryRestService;
    constructor();
    /**
     * Retrieves the list of repositories.
     *
     * @returns A promise that resolves to the list of repositories.
     */
    getRepositories(): Promise<RepositoryList>;
    /**
     * Retrieves triple information for the specified <code>repository</code>.
     *
     * @param repository The repository for which to retrieve size information.
     * @returns A promise that resolves to a {@link RepositorySizeInfo} object containing the repository's triple details.
     */
    getRepositorySizeInfo(repository: Repository): Promise<RepositorySizeInfo>;
}
