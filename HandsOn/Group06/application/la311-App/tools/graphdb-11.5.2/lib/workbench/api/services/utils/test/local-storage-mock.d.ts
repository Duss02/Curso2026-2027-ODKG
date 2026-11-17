export type MutableStorage = Storage & {
    _map: Map<string, string>;
};
export declare class StorageMock implements MutableStorage {
    _map: Map<string, string>;
    get length(): number;
    clear(): void;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare function createMockStorage(): MutableStorage;
