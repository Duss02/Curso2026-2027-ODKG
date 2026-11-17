import { ErrorBase } from '../../../../error';
/**
 * Error thrown when the repository size value returned by the RDF4J server is not a number.
 */
export declare class UnexpectedRepositorySizeError extends ErrorBase {
    constructor(response: unknown);
}
