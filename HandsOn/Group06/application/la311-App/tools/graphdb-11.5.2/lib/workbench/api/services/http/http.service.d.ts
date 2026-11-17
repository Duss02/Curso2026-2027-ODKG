import { HttpOptions, HttpOptionsBlobResponse, HttpOptionsBodyResponse, HttpOptionsHttpResponse, HttpResponse } from '../../models/http';
export declare const HTTP_REQUEST_DONE_EVENT = "http-request-done-event";
/**
 * A service class for performing HTTP requests.
 */
export declare class HttpService {
    private readonly interceptorService;
    private readonly eventEmitter;
    /**
     * Performs an HTTP GET request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    get<T>(url: string, options?: HttpOptions): Promise<T>;
    /**
     * Performs an HTTP GET request.
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data as a Blob.
     */
    get(url: string, options?: HttpOptionsBlobResponse): Promise<HttpResponse<Blob>>;
    /**
     * Performs an HTTP GET request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    get<T>(url: string, options?: HttpOptionsBodyResponse): Promise<T>;
    /**
     * Performs an HTTP GET request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    get<T>(url: string, options?: HttpOptionsHttpResponse): Promise<HttpResponse<T>>;
    /**
     * Performs an HTTP POST request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    post<T>(url: string, options?: HttpOptions): Promise<T>;
    /**
     * Performs an HTTP POST request.
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data as a Blob.
     */
    post(url: string, options?: HttpOptionsBlobResponse): Promise<HttpResponse<Blob>>;
    /**
     * Performs an HTTP POST request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    post<T>(url: string, options?: HttpOptionsBodyResponse): Promise<T>;
    /**
     * Performs an HTTP POST request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    post<T>(url: string, options?: HttpOptionsHttpResponse): Promise<HttpResponse<T>>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    put<T>(url: string, options?: HttpOptions): Promise<T>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    put<T>(url: string, options?: HttpOptionsBodyResponse): Promise<T>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    put<T>(url: string, options?: HttpOptionsHttpResponse): Promise<HttpResponse<T>>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    patch<T>(url: string, options?: HttpOptions): Promise<T>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    patch<T>(url: string, options?: HttpOptionsBodyResponse): Promise<T>;
    /**
     * Performs an HTTP PUT request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    patch<T>(url: string, options?: HttpOptionsHttpResponse): Promise<HttpResponse<T>>;
    /**
     * Performs an HTTP DELETE request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    delete<T>(url: string, options?: HttpOptions): Promise<T>;
    /**
     * Performs an HTTP DELETE request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to the response data of type `T`.
     */
    delete<T>(url: string, options?: HttpOptionsBodyResponse): Promise<T>;
    /**
     * Performs an HTTP DELETE request.
     *
     * @param url     The URL to send the request to.
     * @param options (Optional) An object containing the request options.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    delete<T>(url: string, options?: HttpOptionsHttpResponse): Promise<HttpResponse<T>>;
    /**
     * Uploads a file using an HTTP POST request with multipart/form-data.
     *
     * @param url          The URL to send the request to.
     * @param file         The file to upload.
     * @param fieldName    (Optional) The name of the form field for the file. Defaults to 'file'.
     * @param additionalData (Optional) Additional form fields to include in the upload.
     * @param headers      (Optional) An object containing additional request headers as key-value pairs.
     * @returns A Promise that resolves to HttpResponse<T> with the response data, status, and headers.
     */
    uploadFile<T>(url: string, file: File | Blob, fieldName?: string, headers?: Record<string, string>, additionalData?: Record<string, string | Blob>): Promise<HttpResponse<T>>;
    /**
     * Path string variable can contain characters which encodeURIComponent() can have problems encoding.
     * These characters are replaced in this method.
     * @param str - a component of URI
     * @returns {string} The provided string encoded as a URI component.
     */
    protected encodeURIComponentStrict(str: string): string;
    /**
     * Performs an HTTP request with the specified method and options.
     *
     * @param url     The URL to send the request to.
     * @param method  The HTTP method to use (GET, POST, PUT, DELETE).
     * @param options (Optional) An object containing the request options.
     *                 - `params`: Query parameters as key-value pairs.
     *                 - `headers`: Request headers as key-value pairs.
     *                 - `body`: The request body.
     * @returns A Promise that resolves with HttpResponse<T>, or is rejected with HttpErrorResponse if the request fails.
     */
    private request;
    private getDataFromResponse;
    private getRequestConfig;
    private formatBody;
    private executeRequest;
    private extractHeaders;
    /**
     * Builds a query string from an object of parameters.
     *
     * @param params An object containing query parameters as key-value pairs.
     * @returns A query string suitable for appending to a URL.
     */
    private buildQueryParams;
}
