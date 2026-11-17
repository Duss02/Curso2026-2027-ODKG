import { TooltipInstance } from './tooltip-instance';
import { HTMLElementWithTooltip, HTMLTooltipElement } from '../components/onto-tooltip/models/html-element-with-tooltip';
export declare class TooltipUtil {
    private static readonly ATTR_CONTENT;
    private static readonly ATTR_THEME;
    private static readonly ATTR_PLACEMENT;
    private static readonly ATTR_APPEND_TO;
    private static readonly TOOLTIP_CLASS;
    /**
     * Returns the TooltipInstance associated with an element, if it exists.
     */
    static getTooltipInstance(element: HTMLElement): TooltipInstance | undefined;
    /**
     * Creates a new TooltipInstance on the given element using
     * the OntoTooltipConfiguration.
     *
     * @param target - The HTMLElement to attach the tooltip to.
     * @returns The newly created TooltipInstance.
     */
    static createTooltip(target: HTMLElement): TooltipInstance;
    /**
     * Returns an existing TooltipInstance or creates a new one if not present.
     *
     * @param target - The HTMLElement to find or attach the tooltip to.
     * @returns The existing or newly created TooltipInstance.
     */
    static getOrCreateTooltipInstance(target: HTMLElement): TooltipInstance;
    private static getConfig;
    /**
     * Updates the content of an existing TooltipInstance, if present.
     * Does nothing if tooltip does not exist or content is empty.
     */
    static updateTooltipContent(target: HTMLElement, content: string): void;
    /**
     * Destroys the TooltipInstance on the given element, if present.
     */
    static destroyTooltip(target: HTMLElementWithTooltip): void;
    /**
     * Recursively finds the closest ancestor (including the given element itself) that has a `tooltip-content` attribute.
     * This is used to identify the element associated with a tooltip when an event occurs on a child element.
     *
     * @param element - The starting HTML element where the search begins.
     * @returns The closest HTML element with the `tooltip-content` attribute, or `null` if no such element is found.
     */
    static getTooltipTarget(element: HTMLElement): HTMLElementWithTooltip | null;
    static getTooltip(element: HTMLElement): HTMLTooltipElement | null;
}
