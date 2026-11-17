import { RepositoryState } from './repository-state';
import { RepositoryType } from './repository-type';
import { Model } from '../common';
import { RepositoryReference } from './repository-reference';
/**
 * Holds repository information, such as name, type, state, and other related fields.
 */
export declare class Repository extends Model<Repository> implements RepositoryReference {
    id: string;
    title: string;
    type: RepositoryType | undefined;
    sesameType: string | undefined;
    uri: string;
    externalUrl: string;
    location: string;
    state: RepositoryState | undefined;
    local: boolean | undefined;
    readable: boolean | undefined;
    writable: boolean | undefined;
    unsupported: boolean | undefined;
    isNew?: boolean;
    constructor(data: Partial<Repository>);
    /**
     * Converts the repository to a repository reference.
     * @returns {RepositoryReference} The repository reference.
     */
    toRepositoryReference(): RepositoryReference;
    /**
     * Checks if the repository is of type Ontop.
     * @returns {boolean} True if the repository is of type Ontop, false otherwise.
     */
    isOntop(): boolean;
    /**
     * Checks if the repository is of type FedX.
     * @returns {boolean} True if the repository is of type FedX, false otherwise.
     */
    isFedx(): boolean;
}
