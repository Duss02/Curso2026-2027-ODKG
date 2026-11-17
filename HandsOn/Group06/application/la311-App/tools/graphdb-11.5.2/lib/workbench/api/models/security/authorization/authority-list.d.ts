import { ModelList } from '../../common';
import { GraphdbAuthoritiesModel } from './graphdb-authorities-model';
import { AuthoritiesUiModel } from './authorities-ui-model';
import { RepositoriesPermissions } from './repositories-permissions';
/**
 * Represents a list of authorities in an authenticated user.
 */
export declare class AuthorityList extends ModelList<string> {
    private readonly WILDCARD;
    private readonly GQL_WILDCARD;
    constructor(authorities?: string[]);
    /**
     * Checks if the list contains a specific authority.
     *
     * @param authority - The Authority string to check for in the list.
     * @returns A boolean indicating whether the specified authority is present in the list.
     *          Returns true if the authority is found, false otherwise.
     */
    hasAuthority(authority: string): boolean;
    /**
     * Checks if the list contains a wildcard authority that matches the expected authority.
     *
     * This method searches through the authority list for wildcard authorities that end with
     * either '*' (for non-GraphQL) or '*:GRAPHQL' (for GraphQL), and determines if any of
     * these wildcard authorities would grant access to the specified expected authority.
     * A wildcard authority matches if the expected authority starts with the wildcard's prefix.
     *
     * @param expectedAuthority - The authority string to check against wildcard authorities in the list.
     * @param isGraphQl - Optional flag indicating whether to check for GraphQL wildcard rights ('*:GRAPHQL')
     *                  or standard format ('*'). Defaults to false if not provided.
     * @returns A boolean indicating whether a matching wildcard authority is found.
     *          Returns true if any wildcard authority in the list matches the expected authority,
     *          false otherwise.
     */
    hasWildcardAuthority(expectedAuthority: string, isGraphQl?: boolean): boolean;
    /**
     * Gets a list of custom roles from the authority list.
     * Removes the Authority.CUSTOM_PREFIX from the beginning of each custom role for display purposes.
     *
     * @returns An array of strings representing the custom roles.
     */
    getCustomRoles(): string[];
    /**
     * Converts the AuthorityList to an Authorities UI Model.
     *
     * @returns An AuthoritiesUiModel representing the granted authorities.
     */
    toUIModel(): AuthoritiesUiModel;
    /**
     * Converts the AuthorityList to a GraphDB Authorities Model.
     *
     * @returns A GraphdbAuthoritiesModel representing the authorities in GraphDB format.
     */
    toGraphdbAuthoritiesModel(): GraphdbAuthoritiesModel;
    /**
     * Gets the repositories permissions from the authority list.
     *
     * @returns A RepositoriesPermissions object representing the permissions for each repository.
     */
    getRepositoriesPermissions(): RepositoriesPermissions;
}
