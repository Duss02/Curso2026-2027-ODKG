export declare class HtmlUtil {
    /**
     * Setter for the document body overflow property.
     *
     * @param newOverflow - the new overflow value.
     *
     * @return the old overflow value.
     */
    static setDocumentBodyOverflow(newOverflow: string): string;
    /**
     * Hides the document body overflow.
     *
     * @return the value of overflow before set it to hidden.
     */
    static hideDocumentBodyOverflow(): string;
    /**
     * Focuses the next element within a specified parent element based on the <code>activeElementSelector</code>, that selects all elements to be focused.
     *
     * @param parentElement - The parent element containing the focusable elements.
     * @param activeElementSelector - The CSS selector for identifying focusable elements.
     */
    static focusNextElement(parentElement: HTMLElement, activeElementSelector?: string): void;
    /**
     * Focuses the previous element within a specified parent element based on the <code>activeElementSelector</code>, that selects all elements to be focused.
     *
     * @param parentElement - The parent element containing the focusable elements.
     * @param activeElementSelector - The CSS selector for identifying focusable elements.
     */
    static focusPreviousElement(parentElement: HTMLElement, activeElementSelector?: string): void;
    static preventLeavingDialog(hostElement: HTMLElement, ev: KeyboardEvent): void;
    /**
     * Focuses an element in the document based on the provided CSS selector.
     *
     * @param selector - A CSS selector string used to identify the element to focus.
     *                   This should be a valid CSS selector that uniquely identifies the target element.
     */
    static focusElement(selector: string): void;
    /**
     * Scrolls an element into the visible area of its scrollable container.
     *
     * @param elementSelector - A CSS selector string used to identify the element to scroll into view.
     *                          This should be a valid CSS selector that uniquely identifies the target element.
     * @param options the scroll into view options.
     */
    static scrollElementIntoView(elementSelector: string, options?: ScrollIntoViewOptions): void;
    /**
     * Waits for an element to appear in the DOM by observing DOM mutations.
     * This function creates a MutationObserver that watches for changes in the document body
     * and resolves with the element once it becomes available.
     *
     * @param selector - A CSS selector string used to identify the element to wait for.
     *                   This should be a valid CSS selector that uniquely identifies the target element.
     *
     * @returns A Promise that resolves with the found HTMLElement when it appears in the DOM,
     *          or rejects if an error occurs during the observation process.
     */
    static waitForElement(selector: string): Promise<HTMLElement>;
}
