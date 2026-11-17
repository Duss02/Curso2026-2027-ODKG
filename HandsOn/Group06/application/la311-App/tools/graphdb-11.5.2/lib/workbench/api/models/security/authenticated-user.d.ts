import { Model } from '../common';
import { AuthorityList } from './authorization/authority-list';
import { AppSettings } from '../users/app-settings';
import { User } from '../users/user';
import { CookieConsent } from '../tracking';
/**
 * Represents an authenticated user in the system
 */
export declare class AuthenticatedUser extends Model<AuthenticatedUser> {
    username: string;
    password: string;
    authorities: AuthorityList;
    grantedAuthoritiesUiModel: AuthorityList;
    appSettings: AppSettings;
    external: boolean;
    /**
     * Converts the AuthenticatedUser instance to a User instance.
     *
     * @returns A User instance with the same properties as the AuthenticatedUser.
     */
    toUser(): User;
    /**
     * Creates an AuthenticatedUser instance from a User instance.
     * @param user
     */
    static fromUser(user: User): AuthenticatedUser;
    constructor(data?: Partial<AuthenticatedUser>);
    getCookieConsent(): CookieConsent | undefined;
    setAuthorities(authorityList?: AuthorityList): this;
    setAppSettings(appSettings?: AppSettings): this;
}
