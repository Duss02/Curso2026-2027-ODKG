import { Repository } from './repository';
import { ModelList } from '../common';
/**
 * Holds an array of repositories ({@link Repository}) and provides functions to manipulate them.
 */
export declare class RepositoryList extends ModelList<Repository> {
    constructor(repositories?: Repository[]);
    /**
     * Finds a repository in the list by its ID and location.
     *
     * @param repositoryId - The unique ID of the repository to find.
     * @param location - The location associated with the repository.
     * @param ignoringLocation - If true, the location will be ignored when searching for the repository. Defaults to false.
     * @returns The matching {@link Repository} if found, otherwise `undefined`.
     */
    findRepository(repositoryId: string, location: string, ignoringLocation?: boolean): Repository | undefined;
    /**
     * Sorts the repositories in place by their location and ID.
     */
    sortByLocationAndId(): void;
    /**
     * Filters the list of repositories by excluding those with the specified ID(s) and LOCATION.
     *
     * @param repositories - An array of repositories to exclude from the filtered result.
     * @returns An array of {@link Repository} objects that do not have any of the specified IDs.
     */
    filterByRepository(repositories: Repository[]): Repository[];
    /**
     * Creates a filter function to include only objects with matching `id` and `location`.
     *
     * @param itemsToMatch - An array of objects with `id` and `location` to filter by.
     * @returns A filter function that returns `true` for objects with `id` and `location` matching any of the provided objects.
     */
    private createIdLocationFilter;
}
