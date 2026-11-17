import { HttpRequest } from '../../models/http/http-request';
import { HttpInterceptor } from '../../models/interceptor/http-interceptor';
/**
 * AuthRequestInterceptor is responsible for intercepting HTTP requests and adding authentication
 * and repository information to the request headers.
 */
export declare class AuthRequestInterceptor extends HttpInterceptor<HttpRequest> {
    private readonly authStorage;
    private readonly repositoryStorageService;
    private readonly securityContextService;
    /**
     * Preprocesses the HTTP request by adding authentication and repository information to the headers.
     *
     * This method performs the following tasks:
     * 1. Adds an authorization token to the request headers if available.
     * 2. Adds repository ID and location to the headers if available.
     *
     * @param request - The HTTP request to be processed.
     * @returns A Promise that resolves to the modified HTTP request.
     */
    process(request: HttpRequest): Promise<HttpRequest>;
    shouldProcess(request: HttpRequest): boolean;
    populateHeaders(headers: Record<string, unknown>): void;
    private isOpenIdUrl;
}
