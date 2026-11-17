export declare function debounce<T extends (...args: unknown[]) => void>(func: T, wait?: number): (...args: Parameters<T>) => void;
