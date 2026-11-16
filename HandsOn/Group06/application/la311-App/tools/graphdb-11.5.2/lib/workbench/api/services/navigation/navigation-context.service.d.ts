import { DeriveContextServiceContract } from '../../models/context/update-context-method';
import { ContextService } from '../context';
type NavigationContextFields = {
    readonly PREVIOUS_ROUTE: string;
    readonly RETURN_URL: string;
};
type NavigationContextFieldParams = {
    readonly PREVIOUS_ROUTE: string;
    readonly RETURN_URL: string;
};
/**
 * Service for managing navigation context within the application.
 */
export declare class NavigationContextService extends ContextService<NavigationContextFields> implements DeriveContextServiceContract<NavigationContextFields, NavigationContextFieldParams> {
    /** Key used to store the previous route in the context */
    readonly PREVIOUS_ROUTE = "previousRoute";
    readonly RETURN_URL = "returnUrl";
    /**
     * Updates the previous route in the navigation context.
     *
     * @param value - The route path to store as the previous route
     */
    updatePreviousRoute(value: string): void;
    /**
     * Retrieves the previous route from the navigation context.
     * If the route ends with a '#' character, it will be removed as single-spa
     * doesn't handle trailing hash characters correctly.
     *
     * @returns The previous route path or undefined if not set
     */
    getPreviousRoute(): string | undefined;
    /**
     * Updates the return URL in the navigation context.
     *
     * @param value - The return URL to store
     */
    updateReturnUrl(value: string): void;
    /**
     * Retrieves the return URL from the navigation context.
     *
     * @returns The return URL or undefined if not set
     */
    getReturnUrl(): string | undefined;
    /**
     * Clears the return URL from the navigation context.
     */
    clearReturnUrl(): void;
}
export {};
