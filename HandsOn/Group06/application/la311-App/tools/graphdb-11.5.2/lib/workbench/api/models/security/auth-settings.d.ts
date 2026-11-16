import { Model } from '../common';
import { AppSettings } from '../users/app-settings';
import { AuthorityList } from './authorization/authority-list';
/**
 * Represents an authentication setting.
 */
export declare class AuthSettings extends Model<AuthSettings> {
    appSettings?: AppSettings;
    authorities: AuthorityList;
    enabled?: boolean;
    constructor(data: Partial<AuthSettings>);
}
