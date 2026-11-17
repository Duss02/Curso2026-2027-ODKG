import { Service } from '../../../providers/service/service';
import { SparqlResultsResponse } from '../../../models/sparql';
/**
 * Service for interacting with RDF4J repositories.
 */
export declare class Rdf4jRepositoryService implements Service {
    private readonly rdf4jRestService;
    /**
     * Returns the endpoint URL for getting all statements from the specified repository.
     * @param repositoryId - The ID of the repository for which to get the statements endpoint.
     * @returns The endpoint URL for getting all statements from the specified repository.
     */
    getStatementsEndpoint(repositoryId: string): string;
    /**
     * Returns the endpoint URL for executing SPARQL queries against the specified repository.
     * @param repositoryId - The ID of the repository for which to get the SPARQL endpoint.
     * @returns The endpoint URL for executing SPARQL queries against the specified repository.
     */
    getSparqlEndpoint(repositoryId: string): string;
    /**
     * Retrieves repository size for the specified repository.
     * @param repositoryId - The ID of the repository for which to get the size.
     * @returns A Promise that resolves to the size of the repository as a number.
     * @throws An error if the HTTP request fails or if the response does not contain the expected size data.
     */
    getRepositorySize(repositoryId: string): Promise<number>;
    /**
     * Downloads SPARQL query results as a file in the format specified by the accept header.
     * @param repositoryId - The ID of the repository from which to download the results.
     * @param data - The data to be sent in the request body, typically containing the SPARQL query and any additional
     * parameters.
     * @param acceptHeader - The value for the 'Accept' header indicating the desired format of the response
     * (e.g., 'application/sparql-results+json').
     * @param linkHeader - The value for the 'Link' header, which may contain additional information about the request or
     * response, such as pagination details or related resources.
     * @returns A Promise that resolves to an object containing the file Blob and its extracted filename. The file data is
     * extracted from the HTTP response, and the filename is determined from the 'Content-Disposition' header if available,
     * or defaults to 'download' if not specified.
     * @throws An error if the HTTP request fails or if the response does not contain the expected file data.
     */
    downloadResultsAsFile(repositoryId: string, data: object, acceptHeader: string, linkHeader: string): Promise<{
        data: Blob;
        filename: string;
    }>;
    /**
     * Executes a SPARQL query against the specified repository.
     * @param repositoryId - The ID of the repository to query.
     * @param query - The SPARQL query string.
     * @returns A promise resolving to the raw SPARQL results.
     */
    executeSparqlQuery(repositoryId: string, query: string): Promise<SparqlResultsResponse>;
    /**
     * Extracts the file data and filename from an HTTP response containing a Blob.
     *
     * @param response - The HTTP response object.
     * @param filename - The default filename if none is provided in the response headers.
     * @return An object containing the file Blob and its extracted filename.
     */
    private extractFileFromResponse;
}
