import { Model } from '../common';
import { OperationStatus } from './operation-status';
import { OperationType } from './operation-type';
import { OperationGroup } from './operation-group';
/**
 * Represents an operation in the system.
 */
export declare class Operation extends Model<Operation> {
    value: string;
    status: OperationStatus;
    type: OperationType;
    id: string;
    count: number;
    group: OperationGroup;
    href: string;
    labelKey: string;
    constructor(operation: {
        value: string;
        status: OperationStatus;
        type: OperationType;
    });
    private getCount;
    private getLabelKey;
}
