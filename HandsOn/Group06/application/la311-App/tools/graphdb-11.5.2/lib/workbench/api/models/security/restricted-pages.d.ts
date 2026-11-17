import { Model } from '../common';
/**
 * Holds information about restricted pages for the logged-in user.
 */
export declare class RestrictedPages extends Model<RestrictedPages> {
    private pages;
    isRestricted(pageUrl: string): boolean;
    setPageRestriction(pageUrl: string, isRestricted?: boolean): RestrictedPages;
}
