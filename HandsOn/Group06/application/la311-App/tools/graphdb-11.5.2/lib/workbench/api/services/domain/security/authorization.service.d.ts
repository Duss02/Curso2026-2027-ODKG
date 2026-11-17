import { Service } from '../../../providers/service/service';
import { Authority } from '../../../models/security';
import { Repository, RepositoryReference } from '../../../models/repositories';
import { RepositoryPermissionType } from '../../../models/repositories/repository-permission-type';
/**
 * Service responsible for handling authorization-related operations.
 */
export declare class AuthorizationService implements Service {
    private readonly securityContextService;
    private readonly repositoryStorageService;
    private readonly repositoryContextService;
    private readonly repositoryAuthorityService;
    /**
     * Repository permission resolvers ordered from highest to lowest priority.
     */
    private readonly permissionResolvers;
    constructor();
    /**
     * Determines if free access is allowed based on the security configuration.
     * @returns {boolean} True if free access is enabled, false otherwise.
     */
    hasFreeAccess(): boolean;
    initializeFreeAccess(): void;
    /**
     * Overrides the default (admin) user, when no security is enabled.
     * This is done by setting graphdb.workbench.default.auth=true.
     *
     * When a user does this, he will get a repository manager user instead of the admin. He has the ability to override
     * the user's app settings and authorities.
     */
    initializeOverrideAuth(): void;
    /**
     * Checks if the current user has an admin role.
     * @returns {boolean} True if the user has an admin role, false otherwise.
     */
    isAdmin(): boolean;
    /**
     * Checks if the current user has the repository manager role.
     * @returns {boolean} True if the user has the repository manager role, false otherwise.
     */
    isRepoManager(): boolean;
    /**
     * Checks whether the current user is a repository maintainer for at least one repository.
     *
     * @returns {boolean} `true` if the user has maintenance permission for at least one repository; otherwise, `false`.
     */
    isRepoMaintainer(): boolean;
    /**
     * Checks if the user has a specific role based on the provided authority, configuration, and user details.
     * @param {Authority} role - The authority role to check.
     * @returns {boolean} True if the user has the specified role, false otherwise.
     */
    hasRole(role?: Authority): boolean;
    /**
     * Checks if the current user has read permissions for the specified repository.
     * This method evaluates if the user can read the repository based on security configuration,
     * user authentication status, and user roles.
     *
     * @param {Repository} repository - The repository to check read permissions for.
     * @returns {boolean} True if the user has read permissions for the repository, false otherwise.
     */
    canReadRepo(repository?: Repository): boolean;
    /**
     * Checks if the current user has write permissions for the specified repository.
     * This method evaluates if the user can write to the repository based on security configuration,
     * user authentication status, and user roles.
     * @param repository - The repository to check write permissions for.
     * @returns True if the user has write permissions for the repository, false otherwise.
     */
    canWriteRepo(repository?: Repository): boolean;
    /**
     * Checks whether the current user can maintain the specified repository.
     *
     * @param {RepositoryReference} repository The repository to check.
     * @returns {boolean} `true` if the user can maintain the specified repository; otherwise, `false`.
     */
    canMaintainRepo(repository: RepositoryReference): boolean;
    /**
     * Checks if the current user has GraphQL read permissions for the specified repository.
     * This method determines if the user can execute GraphQL read operations on the repository.
     *
     * @param {Repository} repository - The repository to check GraphQL read permissions for.
     * @returns {boolean} True if the user has GraphQL read permissions for the repository, false otherwise.
     */
    canReadGqlRepo(repository?: Repository): boolean;
    /**
     * Checks if the current user has GraphQL write permissions for the specified repository.
     * This method determines if the user can execute GraphQL write operations on the repository.
     *
     * @param {Repository} repository - The repository to check GraphQL write permissions for.
     * @returns {boolean} True if the user has GraphQL write permissions for the repository, false otherwise.
     */
    canWriteGqlRepo(repository?: Repository): boolean;
    /**
     * Checks if the current user has any GraphQL permissions (read or write) for the specified repository.
     * This is a convenience method that combines the results of canReadGqlRepo and canWriteGqlRepo.
     *
     * @param {Repository} repository - The repository to check GraphQL permissions for.
     * @returns {boolean} True if the user has any GraphQL permissions for the repository, false otherwise.
     */
    hasGqlRights(repository: Repository): boolean;
    /**
     * Checks if the current user has any GraphQL permissions (read or write) for the active repository.
     * @returns True if the user has any GraphQL permissions for the current repository, false otherwise.
     */
    hasGraphqlRightsOverCurrentRepo(): boolean;
    /**
     * Resolves the highest repository permission granted to the current user for the given repository.
     *
     * The first matching resolver is returned. Since the resolvers are ordered from highest to lowest priority,
     * the returned permission has the highest precedence among all matching resolvers.
     *
     * @param {Repository} repository The repository for which to resolve the permission.
     * @returns {RepositoryPermissionType} The highest granted repository permission, or {@link RepositoryPermissionType.NONE}
     * if no permission is granted.
     */
    getRepositoryPermission(repository: Repository): RepositoryPermissionType;
    /**
     * Determines if the current user has authority to access the active route.
     *
     * This method checks if the user has the necessary permissions to access the current route
     * based on the route's defined authority requirements and the user's assigned roles.
     * The method follows these rules:
     * - If no active route exists, access is denied
     * - Admin users always have access to all routes
     * - Routes without defined authority requirements are accessible to all
     * - If no repository is selected, authority checks are bypassed
     * - If the user has any of the authorities required by the route, access is granted
     *
     * @returns {boolean} True if the user has authority to access the current route, false otherwise
     */
    hasAuthority(): boolean;
    /**
     * Updates the permissions for restricted pages based on the current user's roles and authorities.
     */
    updatePermissions(): void;
    isAdminOrRepoManager(): boolean;
    canExtendExternalUsers(): boolean;
    private resolveAuthorities;
    private getSecurityConfig;
    private getAuthenticatedUser;
    /**
     * Checks whether the current user has the specified permission for a repository.
     *
     * @param {string} permission - The permission to check.
     * @param {RepositoryReference} [repo] - The repository to check.
     * @returns {boolean} `true` if the user has the specified repository permission; otherwise, `false`.
     */
    hasRepoPermission(permission: RepositoryPermissionType, repo?: RepositoryReference): boolean;
    private hasBasePermissions;
    private hasGraphqlPermissions;
    /**
     * Creates and orders the repository permission resolvers from highest to lowest priority.
     *
     * @returns {RepositoryPermissionResolver[]} The ordered repository permission resolvers.
     */
    private initPermissionResolvers;
}
