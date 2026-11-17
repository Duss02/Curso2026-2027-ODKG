import { LocalStorageService } from '../../../storage';
import { StorageData } from '../../../../models/storage';
/**
 * Service for managing OpenID Connect authentication data in local storage.
 *
 * Provides methods to store, retrieve, and clear tokens, PKCE parameters,
 * and other OpenID Connect related data with proper namespacing.
 */
export declare class OpenidStorageService extends LocalStorageService {
    private readonly accessToken;
    private readonly idToken;
    private readonly refreshToken;
    private readonly tokenType;
    private readonly pkceState;
    private readonly pkceCodeVerifier;
    private readonly nonce;
    private readonly returnUrl;
    readonly NAMESPACE = "auth.openid";
    set(key: string, value: string): void;
    setAccessToken(token: string): void;
    getAccessToken(): StorageData;
    clearAccessToken(): void;
    setIdToken(token: string): void;
    getIdToken(): StorageData;
    clearIdToken(): void;
    setRefreshToken(token: string): void;
    getRefreshToken(): StorageData;
    clearRefreshToken(): void;
    setTokenType(tokenType: string): void;
    getTokenType(): StorageData;
    clearTokenType(): void;
    setPkceState(state: string): void;
    getPkceState(): StorageData;
    clearPkceState(): void;
    setPkceCodeVerifier(codeVerifier: string): void;
    getPkceCodeVerifier(): StorageData;
    clearPkceCodeVerifier(): void;
    setNonce(nonce: string): void;
    getNonce(): StorageData;
    clearNonce(): void;
    setReturnUrl(url: string): void;
    getReturnUrl(): StorageData;
    clearReturnUrl(): void;
    clearTokens(): void;
}
