import { OperationStatusSummary } from '../../../../models/monitoring';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { OperationStatusSummaryResponse } from '../response/operation-status-summary-response';
/**
 * Mapper for converting OperationStatusSummaryResponse to OperationStatusSummary.
 */
export declare const mapOperationSummaryResponseToModel: MapperFn<OperationStatusSummaryResponse, OperationStatusSummary>;
