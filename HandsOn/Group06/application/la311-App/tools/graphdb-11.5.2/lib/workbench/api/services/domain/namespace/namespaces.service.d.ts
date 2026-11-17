import { Service } from '../../../providers/service/service';
import { NamespaceMap } from '../../../models/namespace';
/**
 * Service for interacting with RDF4J repositories.
 */
export declare class NamespacesService implements Service {
    private readonly rdf4jRestService;
    /**
     * Retrieves all prefixes, mapped to their respective URIs.
     *
     * @param repositoryId The unique identifier of the repository for which to retrieve namespaces.
     * @returns A promise that resolves to a NamespaceMap containing prefixes mapped to their URIs.
     */
    getNamespaces(repositoryId: string): Promise<NamespaceMap>;
}
