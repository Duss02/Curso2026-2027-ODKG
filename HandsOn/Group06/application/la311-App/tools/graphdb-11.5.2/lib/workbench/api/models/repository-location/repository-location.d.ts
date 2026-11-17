import { AuthenticationType } from '../security';
import { RepositoryLocationType } from './repository-location-type';
import { Model } from '../common';
/**
 * Holds location information about a repository ({@link RepositoryType}) instance.
 */
export declare class RepositoryLocation extends Model<RepositoryLocation> {
    /**
     * The GraphDB location URL.
     */
    uri: string;
    /**
     * Human readable label.
     */
    label: string;
    /**
     * Username for the location if any. This parameter only makes sense for remote locations.
     */
    username: string;
    /**
     * Password for the location if any. This parameter only makes sense for remote locations.
     */
    password: string;
    /**
     * Authentication type.
     */
    authType: AuthenticationType | undefined;
    /**
     * Remote location type.
     */
    locationType: RepositoryLocationType | undefined;
    /**
     * True if the location is the currently active.
     */
    active: boolean | undefined;
    /**
     * True if the location is local (on the same machine as the workbench).
     */
    local: boolean | undefined;
    /**
     * True if the location is the system location.
     */
    system: boolean | undefined;
    /**
     * Error message, if there was an error connecting to this location
     */
    errorMsg: string;
    /**
     * Default repository for the location.
     */
    defaultRepository: string;
    constructor(data?: Partial<RepositoryLocation>);
}
