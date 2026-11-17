import { HttpInterceptor } from '../../models/interceptor/http-interceptor';
/**
 * Interceptor that handles HTTP 401 Unauthorized responses.
 * When a 401 response is received, it clears the authentication token,
 * redirects the user to the login page, and reloads the application to ensure
 * proper initialization.
 */
export declare class UnauthenticatedInterceptor extends HttpInterceptor<Response> {
    private readonly authenticationStorageService;
    private readonly authenticationService;
    shouldProcess(data: Response): boolean;
    process(data: Response): Promise<Response>;
    shouldRedirectToLogin(url: string): boolean;
}
