import { EventEmitter } from '../../stencil-public-runtime';
import { DropdownItem } from '../../models/dropdown/dropdown-item';
import { DropdownItemAlignment } from '../../models/dropdown/dropdown-item-alignment';
import { Awaitable } from "../../../../api/dist/ontotext-workbench-api";
import { OntoTooltipPlacement } from '../onto-tooltip/models/onto-tooltip-placement';
/**
 * A reusable dropdown component built using StencilJS. This component supports configurable labels, tooltips, icons,
 * and items, making it versatile for various use cases. It also integrates with a translation service to handle
 * internationalization.
 */
export declare class OntoDropdown {
    private readonly logger;
    private readonly GUIDE_SELECTOR_ATTR;
    private dropdownButtonElement;
    hostElement: HTMLOntoDropdownElement;
    /**
     * Indicates whether the dropdown menu is open.
     */
    open: boolean;
    /**
     * Holds the content of the tooltip
     */
    buttonTooltipContent: string;
    /**
     * The name for the dropdown button. This can either be a string (used directly as the button label)
     * or a Stencil component (used to render the button content). It will be used if present;
     * otherwise, the {@link OntoDropdown#dropdownButtonNameLabelKey} will be used.
     */
    dropdownButtonName: string;
    /**
     * The translation label key for the dropdown button name. It will be used if {@link OntoDropdown#dropdownButtonName} is not present.
     */
    dropdownButtonNameLabelKey: string;
    /**
     * Defines the value of the `guide-selector` attribute for the dropdown trigger button.
     */
    dropdownButtonGuideSelector: string;
    /**
     * The dropdown button tooltip. It will be used if present; otherwise, the {@link OntoDropdown#dropdownButtonTooltipLabelKey} will be used.
     */
    dropdownButtonTooltip: string | Awaitable<string>;
    /**
     * The translation label key for the dropdown button tooltip. It will be used if {@link OntoDropdown#dropdownButtonTooltip} is not present.
     */
    dropdownButtonTooltipLabelKey: string;
    /**
     * Icon class for the main dropdown button.
     */
    iconClass: string;
    /**
     * Path or URL to the image used as icon for main dropdown button.
     */
    iconImage: string;
    /**
     * Array of dropdown options.
     */
    items: DropdownItem<unknown>[];
    /**
     *  The tooltip theme to be used. For more information {@link OntoTooltipConfiguration#theme}.
     */
    tooltipTheme: string;
    /**
     * Specifies the items tooltip placement. Accepts a string of the placement or a function that returns the placement.
     * The function takes the isOpen parameter as a boolean and returns the placement as a string.
     * If not provided, the tooltip will be placed to the left.
     *
     */
    tooltipPlacement: OntoTooltipPlacement | ((isOpen: boolean) => OntoTooltipPlacement);
    /**
     * Specifies the dropdown items' alignment. If not provided, the items and the dropdown button will be aligned to the left.
     *
     */
    dropdownAlignment: DropdownItemAlignment;
    /**
     * Flag to determine if the dropdown should close automatically when a click occurs outside the dropdown.
     */
    autoClose: boolean;
    /**
     * Event emitted when a dropdown item is selected.
     * The event payload contains the value of the selected item.
     */
    valueChanged: EventEmitter;
    /**
     * Event emitted when the dropdown opens or closes.
     * The event detail is true when open and false when closed.
     */
    toggle: EventEmitter<boolean>;
    /**
     * Listens for the Escape key keydown event globally.
     * Closes the dropdown menu if the Escape key is pressed.
     *
     * @param ev The keyboard event triggered by the Escape key.
     */
    keydownListener(ev: KeyboardEvent): void;
    /**
     * Listens for mouse click events globally.
     * Closes the dropdown menu if the click occurs outside the dropdown.
     *
     * @param ev The mouse event triggered by a click.
     */
    mouseClickListener(ev: PointerEvent): void;
    componentDidUpdate(): void;
    render(): any;
    private setDropdownButtonTooltip;
    private setDropdownItemTooltip;
    private readonly toggleButtonClickHandler;
    private clearDropdownItemTooltips;
    private itemClickHandler;
    private translate;
    private onSelect;
    private toggleComponent;
    private closeMenu;
    private getTooltipContent;
}
