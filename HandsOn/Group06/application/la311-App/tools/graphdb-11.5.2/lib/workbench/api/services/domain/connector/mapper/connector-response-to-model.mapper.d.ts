import { MapperFn } from '../../../../providers';
import { ConnectorResponse } from '../response/connector-response';
import { BeforeUpdateQueryResult } from '../../../../models/connector';
/**
 * Maps the response from the connectors/check endpoint to the BeforeUpdateQueryResult model.
 * @param data The response from the connectors/check endpoint.
 * @returns The mapped BeforeUpdateQueryResult model.
 */
export declare const mapConnectorResponseToModel: MapperFn<ConnectorResponse, BeforeUpdateQueryResult>;
