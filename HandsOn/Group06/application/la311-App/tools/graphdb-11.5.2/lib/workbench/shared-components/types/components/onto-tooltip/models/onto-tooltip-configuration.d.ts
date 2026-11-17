import { OntoTooltipPlacement } from './onto-tooltip-placement';
/**
 * Holds all tooltip configurations for the Floating UI implementation.
 */
export declare class OntoTooltipConfiguration {
    /**
     * Determines if the tooltip hides upon clicking the reference.
     */
    hideOnClick: boolean;
    /**
     * Determines if the tooltip has interactive content inside of it, so that it can be hovered over and clicked inside without hiding.
     */
    interactive: boolean;
    /**
     * The element to append the tooltip to. It can be:
     * - ```"appendTo: () => document.body"``` - this is the default;
     * - ```"appendTo: 'parent'``` - append to reference's parentNode;
     * - ```" and "appendTo: element"``` - append to an Element.
     */
    appendTo: Element | 'parent' | ((ref: Element) => Element);
    /**
     * The content of the tooltip.
     */
    content: string;
    /**
     * The preferred placement of the tooltip. Note that Popper's flip modifier can change this to the opposite placement if it has more space.
     */
    placement: OntoTooltipPlacement;
    /**
     * Determines if content strings are parsed as HTML instead of text.
     */
    allowHTML: boolean;
    /**
     * Determines the theme of the tooltip element. Themes are created by including a class on the tooltip-box element as part of a selector in the form .tooltip-box[data-theme~='onto-tooltip']
     */
    theme: string;
    /**
     * Invoked once the tooltip begins to show.
     */
    onShow: () => void;
    /**
     * Invoked once the tooltip begins to hide.
     */
    onHide: () => void;
    setHideOnClick(hideOnClick: boolean): OntoTooltipConfiguration;
    setContent(content: string): OntoTooltipConfiguration;
    setPlacement(placement: OntoTooltipPlacement): OntoTooltipConfiguration;
    setAllowHTML(allowHtml: boolean): OntoTooltipConfiguration;
    setTheme(theme: string): OntoTooltipConfiguration;
    setAppendTo(appendTo?: string): OntoTooltipConfiguration;
    private getAppendToTarget;
}
