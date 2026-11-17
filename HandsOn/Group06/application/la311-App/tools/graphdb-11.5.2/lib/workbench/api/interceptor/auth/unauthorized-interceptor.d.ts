import { HttpInterceptor } from '../../models/interceptor/http-interceptor';
/**
 * Interceptor that handles HTTP 403 Forbidden responses.
 * When a 403 response is received, it checks if the current page is restricted
 * and updates the security context accordingly. If the user is not authenticated,
 * it redirects them to the login page.
 */
export declare class UnauthorizedInterceptor extends HttpInterceptor<Response> {
    private readonly securityContextService;
    private readonly authenticationService;
    private readonly logger;
    shouldProcess(data: Response): boolean;
    process(data: Response): Promise<Response>;
    updateRestrictionsForPage(path: string): void;
    shouldRedirectToLogin(): boolean;
}
