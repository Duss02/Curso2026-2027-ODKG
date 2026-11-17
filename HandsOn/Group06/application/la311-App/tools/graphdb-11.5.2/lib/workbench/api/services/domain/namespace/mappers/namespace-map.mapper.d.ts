import { NamespaceMap } from '../../../../models/namespace';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { NamespacesResponse } from '../../rdf4j';
/**
 * Mapper class for converting namespace API responses to a model list of namespaces.
 */
export declare const mapNamespaceResponseToModel: MapperFn<NamespacesResponse, NamespaceMap>;
