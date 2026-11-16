import { Model } from '../common';
import { OperationGroup } from './operation-group';
import { OperationStatus } from './operation-status';
/**
 * Represents a summary of an operation group.
 */
export declare class OperationGroupSummary extends Model<OperationGroupSummary> {
    group: OperationGroup;
    totalOperations: number;
    status: OperationStatus;
    id: string;
    constructor(data: OperationGroupSummary);
}
