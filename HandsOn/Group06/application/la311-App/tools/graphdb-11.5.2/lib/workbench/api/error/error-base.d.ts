export declare abstract class ErrorBase extends Error {
    private readonly text?;
    constructor(text?: string | undefined);
    get message(): string;
}
