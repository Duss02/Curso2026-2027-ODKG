import { InteractiveGuide } from '../../../../models/interactive-guide/interactive-guide';
import { InteractiveGuideResponse } from '../../../../models/interactive-guide/interactive-guide-response';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
/**
 * Maps an array of InteractiveGuideResponse objects to an array of InteractiveGuide objects.
 *
 * @param guides - The array of InteractiveGuideResponse objects to be mapped.
 */
export declare const mapInteractiveGuideListResponseToModel: MapperFn<InteractiveGuideResponse[] | undefined, InteractiveGuide[]>;
