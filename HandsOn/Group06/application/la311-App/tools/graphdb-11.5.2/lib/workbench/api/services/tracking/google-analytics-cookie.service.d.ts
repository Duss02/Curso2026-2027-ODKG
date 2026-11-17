import { Service } from '../../providers/service/service';
declare global {
    interface Window {
        dataLayer?: Record<string, unknown>[];
        google_tag_manager?: Record<string, unknown>;
        google_tag_data?: Record<string, unknown>;
    }
}
export declare class GoogleAnalyticsCookieService implements Service {
    private readonly cookieService;
    private isSettingUp;
    /**
     * Adds the Google Tag Manager (GTM) script to the document's head if it is not already present.
     * This function creates a new script element for GTM and appends it to the document's head.
     */
    setIfAbsent(): void;
    /**
     * Removes all Google Analytics-related scripts and cookies from the document.
     */
    remove(): void;
    /**
     * Retrieves all cookies with a specified prefix and removes each of them.
     */
    removeGoogleAnalyticsCookies(): void;
    /**
     * Disables the Google Tag Manager (GTM) by preventing any further events from being pushed to the `dataLayer`.
     * This function also removes all existing GTM script elements from the document's head and body.
     *
     * Since this is a Single Page Application (SPA), removing and re-adding scripts must happen dynamically without
     * reloading the window. This method is used to remove GTM scripts when tracking is disallowed, rather than
     * performing a page reload, which is generally avoided
     *
     * 1. Disables the `dataLayer.push` method to prevent further GTM events from being tracked.
     * 2. Searches for and removes any `<script>` elements that include 'googletagmanager' in their `src` or script content.
     */
    private removeGoogleAnalyticsScripts;
    /**
     * Checks if a Google Tag Manager (GTM) script is already present in the document.
     *
     * When the GTM script is injected, it dynamically adds additional scripts depending on how many tags
     * are configured within your GTM container. These scripts are usually inserted into the `<head>` section,
     * but it’s better to search through the entire document to ensure all related GTM scripts are found.
     *
     * This function searches through all `<script>` elements in the document and returns `true` if any script
     * has a `src` attribute that contains 'googletagmanager'. It returns `false` otherwise.
     *
     * @return Returns `true` if a GTM script is found, otherwise `false`.
     */
    private gtmScriptExists;
}
