import { AuthenticationType } from '../../../../models/security';
import { RepositoryLocation, RepositoryLocationType } from '../../../../models/repository-location';
export declare class RepositoryLocationMockProvider {
    static provideRepositoryLocation(uri: string): RepositoryLocation;
    static provideRawRepositoryLocation(uri: string): {
        uri: string;
        label: string;
        username: string;
        password: string;
        authType: AuthenticationType;
        locationType: RepositoryLocationType;
        active: boolean;
        local: boolean;
        system: boolean;
        errorMsg: string;
        defaultRepository: string;
    };
}
