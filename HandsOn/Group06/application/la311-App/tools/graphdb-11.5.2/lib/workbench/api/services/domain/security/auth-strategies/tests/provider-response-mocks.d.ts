import { UserResponse } from '../../../users/response/user-response';
export declare const ProviderResponseMocks: {
    authenticatedUserResponse: {
        username: string;
        password: string;
        authorities: string[];
        appSettings: {
            DEFAULT_SAMEAS: boolean;
            DEFAULT_INFERENCE: boolean;
            EXECUTE_COUNT: boolean;
            IGNORE_SHARED_QUERIES: boolean;
            DEFAULT_VIS_GRAPH_SCHEMA: boolean;
        };
        external: boolean;
    };
    adminUserResponse: UserResponse;
    loginResponse: {
        username: string;
        password: string;
        authorities: string[];
        appSettings: {
            COOKIE_CONSENT: undefined;
            DEFAULT_SAMEAS: boolean;
            DEFAULT_INFERENCE: boolean;
            EXECUTE_COUNT: boolean;
            IGNORE_SHARED_QUERIES: boolean;
            DEFAULT_VIS_GRAPH_SCHEMA: boolean;
        };
        external: boolean;
    };
    securityConfig: {
        freeAccess: {
            enabled: boolean;
            authorities: string[];
            appSettings: {
                DEFAULT_INFERENCE: boolean;
                DEFAULT_VIS_GRAPH_SCHEMA: boolean;
                DEFAULT_SAMEAS: boolean;
                IGNORE_SHARED_QUERIES: boolean;
                EXECUTE_COUNT: boolean;
                COOKIE_CONSENT: undefined;
            };
        };
        overrideAuth: {
            enabled: boolean;
            authorities: string[];
            appSettings: {
                DEFAULT_INFERENCE: boolean;
                DEFAULT_VIS_GRAPH_SCHEMA: boolean;
                DEFAULT_SAMEAS: boolean;
                IGNORE_SHARED_QUERIES: boolean;
                EXECUTE_COUNT: boolean;
            };
        };
        methodSettings: {};
        passwordLoginEnabled: boolean;
        hasExternalAuth: boolean;
        authImplementation: string;
        openIdEnabled: boolean;
        enabled: boolean;
    };
};
