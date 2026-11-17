import { HttpRequest } from '../../models/http/http-request';
import { HttpInterceptor } from '../../models/interceptor/http-interceptor';
import { ModelList } from '../../models/common';
/**
 * Service responsible for managing and executing HTTP interceptors.
 */
export declare class InterceptorService {
    private preProcessors;
    private postProcessors;
    /**
     * Chains all interceptors, which {@link HttpInterceptor#shouldPreProcess should pre-process} the request.
     * @param request The initial HTTP request.
     * @returns A promise that resolves to the final processed HTTP request.
     */
    preProcess(request: HttpRequest): Promise<HttpRequest>;
    /**
     * Chains all interceptors, which {@link HttpInterceptor#shouldPostProcess should post process} the response.
     * @param response The initial HTTP response.
     * @returns A promise that resolves to the final processed HTTP response.
     */
    postProcess(response: Response): Promise<Response>;
    /**
     * Registers new pre-processors for HTTP requests.
     * Adds the provided elements to the existing pre-processors and sorts all elements again.
     *
     * @param preProcessors - A ModelList containing HttpInterceptor instances for HttpRequest objects.
     *                        These interceptors will be used to pre-process HTTP requests.
     */
    registerRequestInterceptors(preProcessors: ModelList<HttpInterceptor<HttpRequest>>): void;
    /**
     * Registers new post-processors for HTTP responses.
     * Adds the provided elements to the existing postProcessors and sorts all elements again.
     *
     * @param postProcessors - An array containing HttpInterceptor instances for Response objects.
     *                         These interceptors will be used to post-process HTTP responses.
     */
    registerResponseInterceptors(postProcessors: ModelList<HttpInterceptor<Response>>): void;
    private sortInterceptors;
}
