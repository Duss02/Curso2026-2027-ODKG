export declare class OntoTooltip {
    private observer;
    /**
     * Checks if the target of the 'mouseover' event has tooltip configuration.
     * If it does, creates a tooltip instance and displays it.
     *
     * @param event - The 'mouseover' event triggered on a document element.
     */
    onMouseover(event: MouseEvent): void;
    private handleTooltipShow;
    private handleTooltipTargetShow;
    /**
     * Destroys the tooltip if it is present.
     *
     * @param event - The 'mouseout' event triggered on a document element.
     */
    onMouseout(event: MouseEvent): void;
    private handleTooltipHide;
    private handleTooltipTargetHide;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): any;
    /**
     * Clears tooltips associated with elements that have been removed from the DOM.
     *
     * @param records - An array of MutationRecord objects, each representing a change to the DOM tree.
     *                  The function iterates over these records to find and clear tooltips for removed nodes.
     */
    private readonly clearTooltipsForRemovedElements;
    /**
     * Recursively removes tooltips from a given node and its children.
     *
     * This function checks if the given node is an HTMLElement and has an associated tooltip.
     * If a tooltip is found, it is destroyed. If not, the function then recursively checks all child nodes.
     *
     * @param node - The DOM node to check for tooltips.
     * @returns A boolean indicating whether a tooltip was found and destroyed (true) or not (false).
     */
    private readonly removeTooltipFromNode;
    /**
     * Initializes a MutationObserver to monitor the document body for removed nodes.
     * When nodes are removed, it triggers the clearing of tooltips associated with those nodes.
     */
    private handleRemovedNodes;
}
