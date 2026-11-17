import { ContextService } from '../../context';
import { Repository, RepositoryList, RepositoryReference } from '../../../models/repositories';
import { ValueChangeCallback } from '../../../models/context/value-change-callback';
import { DeriveContextServiceContract } from '../../../models/context/update-context-method';
import { BeforeChangeValidationPromise } from '../../../models/context/before-change-validation-promise';
import { LifecycleHooks } from '../../../providers/service/lifecycle-hooks';
type RepositoryContextFields = {
    readonly REPOSITORY_LIST: string;
    readonly SELECTED_REPOSITORY: string;
};
type RepositoryContextFieldParams = {
    readonly REPOSITORY_LIST: RepositoryList;
    readonly SELECTED_REPOSITORY: RepositoryReference;
};
/**
 * The RepositoryContextService class manages the application's repository context.
 */
export declare class RepositoryContextService extends ContextService<RepositoryContextFields> implements DeriveContextServiceContract<RepositoryContextFields, RepositoryContextFieldParams>, LifecycleHooks {
    readonly SELECTED_REPOSITORY = "selectedRepository";
    readonly REPOSITORY_LIST = "repositoryList";
    private readonly logger;
    /**
     * Updates the selected repository and notifies subscribers about the change.
     *
     * @param [repositoryReference] - The new repository to set as selected. Optional.
     */
    updateSelectedRepository(repositoryReference?: RepositoryReference): Promise<void>;
    /**
     * Retrieves the currently selected repository.
     */
    getSelectedRepository(): Repository | undefined;
    /**
     * Registers the <code>callbackFunction</code> to be called whenever the selected repository changes.
     *
     * @param callbackFunction - The function to call when the selected repository changes.
     * @param beforeChangeValidationPromise - Optional. A promise that will be resolved before
     *        the repository change is applied. This can be used to validate or prepare for the
     *        repository change. If the promise is resolved with false or rejects, the repository change will be canceled.
     * @returns A function to unsubscribe from updates.
     */
    onSelectedRepositoryChanged(callbackFunction: ValueChangeCallback<Repository | undefined>, beforeChangeValidationPromise?: BeforeChangeValidationPromise<Repository | undefined>): () => void;
    /**
     * Updates the list with repositories and notifies subscribers about the change.
     *
     * @param repositories - The new list with repositories.
     */
    updateRepositoryList(repositories: RepositoryList): void;
    /**
     * Retrieves the list of repositories from the current context.
     *
     * @returns {RepositoryList} The list of repositories. Returns an empty RepositoryList if none is found.
     */
    getRepositoryList(): RepositoryList;
    /**
     *
     * Registers the <code>callbackFunction</code> to be called whenever the repository list changes.
     *
     * @param callbackFunction - The function to call when the repository list changes.
     * @returns A function to unsubscribe from updates.
     */
    onRepositoryListChanged(callbackFunction: ValueChangeCallback<RepositoryList | undefined>): () => void;
    protected getDeserializedContext(): {
        selectedRepository: (repository: string) => Repository | undefined;
    };
    /**
     * Deserializes a repository from the given string value. The value is expected to be a JSON string representing a RepositoryReference.
     *
     * This method is used to deserialize objects stored in localStorage.
     *
     * @param repository - The value retrieved from localStorage.
     * @returns The repository from the repository list if found, otherwise `undefined`.
     */
    private readonly deserializeRepository;
    /**
     * Finds and returns a repository matching the given repository reference.
     *
     * @param {RepositoryReference} repositoryReference - The reference containing `id` and `location` to identify the repository.
     * @param ignoringLocation - If true, the location will be ignored when searching for the repository. Defaults to false.
     * @returns {Repository | undefined} The matching repository if found; otherwise, undefined.
     */
    findRepository(repositoryReference?: RepositoryReference, ignoringLocation?: boolean): Repository | undefined;
    /**
     * Checks if a repository exists in the current repository list based on the provided reference.
     * @param repositoryReference - The reference of the repository to check.
     * @param ignoringLocation - If true, the location will be ignored when checking for repository existence. Defaults to false.
     * @returns True if the repository exists; otherwise, false.
     */
    repositoryExists(repositoryReference: RepositoryReference, ignoringLocation?: boolean): boolean;
    /**
     * Checks if the currently active repository is of type Ontop.
     * @returns True if the active repository is of type Ontop, false otherwise.
     */
    isActiveRepoOntopType(): boolean;
}
export {};
