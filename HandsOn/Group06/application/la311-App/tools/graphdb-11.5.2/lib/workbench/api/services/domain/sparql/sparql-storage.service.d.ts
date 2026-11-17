import { LocalStorageService } from '../../storage';
/**
 * Service for managing SPARQL editor related data in local storage.
 */
export declare class SparqlStorageService extends LocalStorageService {
    readonly NAMESPACE = "sparqlEditor";
    private readonly logger;
    /**
     * Key for storing the last used in the editor repository. This is used to pre-select the repository in the editor
     * when the user opens it again.
     */
    readonly LAST_USED_REPOSITORY = "lastUsedRepository";
    /**
     * Legacy key for storing the last used repository. This is used to migrate data from older versions of the
     * application that used a different key for this data.
     */
    private readonly LEGACY_LAST_USED_REPOSITORY_KEY;
    set(key: string, value: string): void;
    setLastUsedRepository(repositoryId: string): void;
    getLastUsedRepository(): string | null;
    private migrateLastUsedRepositoryKey;
}
