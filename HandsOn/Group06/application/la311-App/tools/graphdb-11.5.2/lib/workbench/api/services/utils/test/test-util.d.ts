import { ResponseMock } from '../../http/test/response-mock';
export declare class TestUtil {
    private static requestsMap;
    static getRequest(url: string): RequestInit | undefined;
    static mockResponse(responseMock: ResponseMock): void;
    static mockResponses(responseMocks: ResponseMock[]): void;
    /**
     * Clears all mocks after each test to ensure isolation.
     */
    static restoreAllMocks(): void;
}
