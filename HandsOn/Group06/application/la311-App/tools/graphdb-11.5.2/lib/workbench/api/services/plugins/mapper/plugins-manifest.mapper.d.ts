import { PluginsManifest } from '../../../models/plugins';
import { MapperFn } from '../../../providers/mapper/mapper-fn';
import { PluginsManifestResponse } from '../response/plugins-manifest-response';
/**
 * Maps the raw data to an instance of the {@link PluginsManifest} model.
 */
export declare const mapPluginsManifestResponseToModel: MapperFn<PluginsManifestResponse, PluginsManifest>;
