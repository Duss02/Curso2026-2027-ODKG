export declare class ResponseMock {
    private readonly _url;
    private _response;
    private _blob?;
    private _status;
    private _message;
    private _headers?;
    private _shouldThrowOnJson;
    constructor(url: string);
    getUrl(): string | undefined;
    setResponse(value: unknown): this;
    getResponse(): unknown;
    setBlob(value: Blob): this;
    getBlob(): Blob | undefined;
    setStatus(value: number): this;
    getStatus(): number;
    setMessage(value: string): this;
    getMessage(): string | undefined;
    getHeaders(): Headers | undefined;
    setHeaders(headers: Headers): this;
    setSetThrowOnJson(shouldThrowOnJson: boolean): this;
    getShouldThrowOnJson(): boolean;
}
