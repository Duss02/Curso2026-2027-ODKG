import { Model } from '../common';
import { AuthorityList } from '../security';
import { AppSettings } from './app-settings';
export declare enum UserType {
    ADMIN = "admin",
    REPO_MANAGER = "repoManager",
    USER = "user"
}
/**
 * Represents a user model in the system.
 */
export declare class User extends Model<User> {
    username: string;
    password?: string;
    confirmPassword?: string;
    authorities: AuthorityList;
    appSettings: AppSettings;
    dateCreated: Date | null;
    gptThreads: string[];
    /**
     * Whether the user has logged in through an external authentication source at least once.
     *
     * On the first external login, GraphDB adds the user to its local user pool, where application settings are stored.
     */
    hasExternalLogin: boolean;
    constructor(data?: Partial<User>);
    /**
     * Determines the user type based on their authorities.
     */
    getUserType(): UserType;
    /**
     * Determines the user type description based on the user type.
     */
    getUserTypeDescription(): string;
}
