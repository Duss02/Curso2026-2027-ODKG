import { HttpService } from '../../http/http.service';
import { Repository } from '../../../models/repositories';
import { RepositoryListResponse } from './response/repository-response';
import { RepositorySizeInfoResponse } from './response/repository-info-response';
export declare class RepositoryRestService extends HttpService {
    static readonly REPOSITORIES_ENDPOINT = "rest/repositories";
    getRepositories(): Promise<RepositoryListResponse>;
    getRepositorySizeInfo(repository: Repository): Promise<RepositorySizeInfoResponse>;
}
