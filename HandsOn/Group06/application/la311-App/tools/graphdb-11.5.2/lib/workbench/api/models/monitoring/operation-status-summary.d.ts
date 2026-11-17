import { Model } from '../common';
import { OperationStatus } from './operation-status';
import { OperationList } from './operation-list';
import { OperationGroupSummary } from './operation-group-summary';
import { OperationGroupSummaryList } from './operation-group-summary-list';
/**
 * Model of the summary of operation statuses.
 *
 * Holds the status of the entire operation list and a list of individual operations.
 * Currently, these could be backup, sparql querying and cluster operations
 */
export declare class OperationStatusSummary extends Model<OperationStatusSummary> {
    status: OperationStatus;
    allRunningOperations: OperationList;
    constructor(operationStatusSummary: {
        status: OperationStatus;
        allRunningOperations: OperationList;
    });
    /**
     * Transforms the OperationStatusSummary data into a grouped summary format.
     * This function aggregates operations by their group, calculates total operations per group,
     * and determines the highest severity status for each group.
     *
     * @returns {OperationGroupSummary[]} A mapped list of operation group summaries with aggregated statistics
     */
    toOperationsGroupSummary(): OperationGroupSummary[];
    /**
     * Converts the operation status summary into a list of operation group summaries.
     *
     * @returns A list of operation group summaries.
     */
    toOperationGroupSummaryList(): OperationGroupSummaryList;
}
