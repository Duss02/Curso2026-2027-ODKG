export declare class BeforeUpdateQueryResult {
    status: string;
    command: string;
    messageLabelKey?: string | undefined;
    parameters?: unknown | undefined;
    message?: string | undefined;
    iri?: string | undefined;
    name?: string | undefined;
    constructor(status: string, command: string, messageLabelKey?: string | undefined, parameters?: unknown | undefined, message?: string | undefined, iri?: string | undefined, name?: string | undefined);
}
export declare const BeforeUpdateQueryResultStatus: {
    ERROR: string;
    SUCCESS: string;
};
