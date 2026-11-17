import { Service } from '../../../providers/service/service';
import { RepositoryReference } from '../../../models/repositories';
/**
 * Service responsible for generating authority strings related to repository access control.
 */
export declare class RepositoryAuthorityService implements Service {
    private readonly GRAPHQL_REPO_AUTHORITY;
    private readonly SYSTEM_REPOSITORY_ID;
    /**
     * Checks if the given repository is a system repository.
     * @param repository The repository to check.
     * @returns True if the repository is a system repository, false otherwise.
     */
    isSystemRepository(repository: RepositoryReference): boolean;
    /**
     * Generates the authority string for the current repository based on the provided action and repository ID.
     * @param action The action for which to generate the authority (e.g., 'READ', 'WRITE').
     * @param repositoryId The ID of the repository for which to generate the authority.
     * @returns The generated authority string for the current repository.
     */
    getCurrentGqlRepoAuthority(action: string, repositoryId: string): string;
    /**
     * Generates the authority string for all repositories based on the provided action.
     * @param action The action for which to generate the authority (e.g., 'READ', 'WRITE').
     * @returns The generated authority string for all repositories.
     */
    getOverallGqlRepoAuthority(action: string): string;
    /**
     * Generates a location-specific identifier for the given repository. If the repository has a location, the identifier
     * is in the format "id@location". Otherwise, it is simply the repository ID.
     * @param repository The repository for which to generate the location-specific identifier.
     * @returns The location-specific identifier for the repository.
     */
    getLocationSpecificId(repository: RepositoryReference): string;
    /**
     * Generates the authority string for a specific repository based on the provided action and repository ID.
     * @param action The action for which to generate the authority (e.g., 'READ', 'WRITE').
     * @param repositoryId The ID of the repository for which to generate the authority.
     * @returns The generated authority string for the specific repository.
     */
    getCurrentRepoAuthority(action: string, repositoryId: string): string;
    /**
     * Generates the authority string for all repositories based on the provided action. The authority string is in the format "ACTION_REPO_*".
     * @param action The action for which to generate the authority (e.g., 'READ', 'WRITE').
     * @returns The generated authority string for all repositories.
     */
    getOverallRepoAuthority(action: string): string;
}
