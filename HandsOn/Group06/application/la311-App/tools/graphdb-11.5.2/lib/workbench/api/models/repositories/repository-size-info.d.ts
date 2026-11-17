import { Model } from '../common';
/**
 * Holds repository triples information.
 */
export declare class RepositorySizeInfo extends Model<RepositorySizeInfo> {
    /**
     * Number of inferred triples.
     */
    inferred: number;
    /**
     * Number of all triples.
     */
    total: number;
    /**
     * Number of explicit triples.
     */
    explicit: number;
    constructor(data?: Partial<RepositorySizeInfo>);
}
