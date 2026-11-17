import { LocalStorageService } from '../storage';
/**
 * Service that handles the language related properties in the local storage.
 */
export declare class LanguageStorageService extends LocalStorageService {
    readonly NAMESPACE = "i18n";
    set(key: string, value: string): void;
}
