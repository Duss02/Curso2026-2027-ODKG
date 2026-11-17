import { LocalStorageService } from '../../storage/local-storage.service';
import { StorageData } from '../../../models/storage';
/**
 * A service for managing authentication-related local storage operations.
 */
export declare class AuthenticationStorageService extends LocalStorageService {
    readonly jwtKey = "jwt";
    readonly authenticatedKey = "authenticated";
    readonly NAMESPACE = "auth";
    set(key: string, value: string): void;
    /**
     * Retrieves the authentication token from storage.
     * @returns The stored authentication token as StorageData.
     */
    getAuthToken(): StorageData;
    setAuthenticated(authenticated: boolean): void;
    isAuthenticated(): boolean;
    setAuthToken(value: string): void;
    clearAuthToken(): void;
    isGDBorOpenIDToken(): boolean;
    isGDBToken(): boolean;
    isOpenIDToken(): boolean;
}
