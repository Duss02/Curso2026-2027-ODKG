import { OntoTooltipConfiguration } from '../components/onto-tooltip/models/onto-tooltip-configuration';
import { HTMLElementWithTooltip } from '../components/onto-tooltip/models/html-element-with-tooltip';
/**
 * A wrapper class that provides a Tooltip.
 */
export declare class TooltipInstance {
    private readonly referenceElement;
    private readonly config;
    private static readonly DESTROY_DELAY_MS;
    private floatingElement;
    private arrowElement;
    private cleanupAutoUpdate;
    private isVisible;
    private isDestroyed;
    private pendingDestroy;
    constructor(referenceElement: HTMLElementWithTooltip, config: OntoTooltipConfiguration);
    /**
     * Shows the tooltip by computing its position and making it visible.
     */
    show(): void;
    /**
     * Hides the tooltip.
     */
    hide(): void;
    /**
     * Updates the content of the tooltip.
     */
    setContent(content: string): void;
    /**
     * Destroys the tooltip and cleans up resources.
     */
    destroy(): void;
    /**
     * Creates the floating tooltip element.
     */
    private createFloatingElement;
    /**
     * Creates the arrow element for the tooltip.
     */
    private createArrowElement;
    /**
     * Appends the floating element to the target container.
     */
    private appendToTarget;
    /**
     * Computes and updates the position of the tooltip.
     */
    private updatePosition;
    /**
     * Maps OntoTooltipPlacement to Floating UI Placement.
     */
    private mapPlacement;
}
