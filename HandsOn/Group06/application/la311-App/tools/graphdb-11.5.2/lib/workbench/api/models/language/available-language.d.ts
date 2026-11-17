import { Model } from '../common';
/**
 * Represents an available language in the system.
 */
export declare class AvailableLanguage extends Model<AvailableLanguage> {
    readonly key: string;
    readonly name: string;
    constructor(key: string, name: string);
}
