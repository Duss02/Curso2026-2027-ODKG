import { HttpService } from '../http/http.service';
import { Configuration } from '../../models/configuration';
export declare class ConfigurationRestService extends HttpService {
    getConfiguration(): Promise<Configuration | undefined>;
}
