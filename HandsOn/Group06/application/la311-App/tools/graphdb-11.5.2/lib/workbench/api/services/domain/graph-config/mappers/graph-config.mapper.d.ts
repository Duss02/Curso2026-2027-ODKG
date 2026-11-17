import { MapperFn } from '../../../../providers';
import { GraphConfigListResponse, GraphConfigResponse } from '../response/graph-config-response';
import { GraphConfigList, GraphConfig } from '../../../../models/graph-config';
/**
 * Maps server response data {@link GraphConfigListResponse} to a {@link GraphConfigList} model.
 *
 * Processes an array of graph configuration responses and converts each item into a {@link GraphConfig} instance.
 *
 * @param data - The server response containing an array of graph configurations.
 * @returns A {@link GraphConfigList} containing mapped graph configurations.
 */
export declare const mapGraphConfigListResponseToModel: MapperFn<GraphConfigListResponse, GraphConfigList>;
/**
 * Maps a single {@link GraphConfigResponse} object to a {@link GraphConfig} model.
 *
 * @param data - The graph configuration response from the server.
 * @returns A {@link GraphConfig} instance.
 */
export declare const mapGraphConfigResponseToModel: MapperFn<GraphConfigResponse, GraphConfig>;
