import { ExtensionPoint } from './extension-point';
import { GuidePlugin } from '../plugins/interactive-guide/guide-plugin';
/**
 * Extension point for interactive guide plugins.
 *
 * Holds plugins related to the steps used in guides or tutorials within the application.
 */
export declare class InteractiveGuideExtensionPoint extends ExtensionPoint<GuidePlugin> {
    static readonly NAME = "guide.step";
    /**
     * Name of the extension point, used for registration and lookup
     */
    name: string;
    /**
     * Field used to uniquely identify plugins within this extension point
     */
    fieldIdName: string;
}
