import { CookieStore } from '../cookie-store';
/**
 * In-memory implementation of {@link CookieStore} that simulates browser cookie semantics.
 * Intended for use in tests and server-side / non-browser environments.
 */
export declare class InMemoryCookieStore implements CookieStore {
    private readonly cookies;
    read(): string;
    write(cookie: string): void;
    clear(): void;
}
