import { CookieConsent } from '../tracking';
/**
 * Represents application settings for a user.
 */
export declare class AppSettings {
    DEFAULT_VIS_GRAPH_SCHEMA: boolean;
    DEFAULT_INFERENCE: boolean;
    DEFAULT_SAMEAS: boolean;
    IGNORE_SHARED_QUERIES: boolean;
    EXECUTE_COUNT: boolean;
    COOKIE_CONSENT?: CookieConsent;
    constructor(data?: Partial<AppSettings>);
    /**
     * Converts the AppSettings instance to a POJO.
     * @returns A POJO representation of the AppSettings instance.
     */
    toJSON(): Record<string, unknown>;
}
