import { LocalStorageService } from '../storage/local-storage.service';
export declare class UserPermissionStorageService extends LocalStorageService {
    readonly NAMESPACE = "auth";
    set(key: string, value: string): void;
}
