import { HttpService } from '../../http/http.service';
import { RepositoryLocationResponse } from './response/repository-location-response';
export declare class RepositoryLocationRestService extends HttpService {
    getActiveRepositoryLocation(): Promise<RepositoryLocationResponse>;
}
