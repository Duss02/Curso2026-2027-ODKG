import { Service } from '../../../providers/service/service';
import { SavedQueryList } from '../../../models/sparql';
import { SaveQueryRequest } from './request/save-query-request';
/**
 * Service for handling SPARQL-related operations.
 */
export declare class SparqlService implements Service {
    private readonly sparqlRestService;
    /**
     * Retrieves a saved SPARQL query by its name and owner.
     * @param queryName - The name of the saved query to retrieve.
     * @param owner - The owner of the saved query. Optional.
     * @returns A promise that resolves to the saved query model.
     */
    getSavedQuery(queryName: string, owner: string): Promise<SavedQueryList>;
    /**
     * Retrieves all saved queries from the server.
     * @returns A promise that resolves to the list with saved queries.
     */
    getSavedQueries(): Promise<SavedQueryList>;
    /**
     * Saves a sparql query.
     * @param payload The save query request payload containing the query data to be saved.
     * @returns A promise that resolves when the query is successfully saved, or rejects with an error if the operation fails.
     */
    saveQuery(payload: SaveQueryRequest): Promise<void>;
    /**
     * Updates existing saved sparql query.
     * @param oldQueryName The existing saved query name which should be updated.
     * @param payload The update query request payload.
     * @returns Promise that resolves when the query is successfully updated, or rejects with an error if the operation fails.
     */
    updateQuery(oldQueryName: string, payload: SaveQueryRequest): Promise<void>;
    /**
     * Deletes a saved query by its name.
     * @param queryName The name of the saved query to be deleted.
     * @returns Promise that resolves when the query is successfully deleted, or rejects with an error if the operation fails.
     */
    deleteQuery(queryName: string): Promise<void>;
    /**
     * Adds known prefixes to the provided SPARQL query.
     * @param query The SPARQL query to which known prefixes should be added.
     * @returns The SPARQL query with known prefixes added.
     */
    addKnownPrefixes(query: string): Promise<string>;
}
