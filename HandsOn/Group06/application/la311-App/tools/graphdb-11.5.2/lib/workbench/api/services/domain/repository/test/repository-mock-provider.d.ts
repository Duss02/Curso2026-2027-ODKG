import { Repository, RepositoryState, RepositoryType } from '../../../../models/repositories';
export declare class RepositoryMockProvider {
    static provideRepository(id: string, location?: string): Repository;
    static provideRawRepository(id: string, location?: string): {
        id: string;
        location: string;
        title: string;
        externalUrl: string;
        local: boolean;
        readable: boolean;
        sesameType: string;
        state: RepositoryState;
        type: RepositoryType;
        unsupported: boolean;
        uri: string;
        writable: boolean;
    };
}
