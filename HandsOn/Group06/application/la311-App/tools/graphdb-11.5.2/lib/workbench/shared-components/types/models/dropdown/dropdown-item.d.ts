import { Awaitable } from "../../../../api/dist/ontotext-workbench-api";
/**
 * Model that holds a dropdown item configuration.
 */
export declare class DropdownItem<T> {
    /**
     * The dropdown item name. It will be used if present; otherwise, the {@link DropdownItem._nameLabelKey} will be used.
     */
    private _name;
    /**
     * The translation label key for the dropdown item name. It will be used if {@link DropdownItem._name} is not present.
     */
    private _nameLabelKey;
    /**
     * The dropdown item tooltip. It will be used if present; otherwise, the {@link DropdownItem._tooltipLabelKey} will be used.
     */
    private _tooltip;
    /**
     * The translation label key for the dropdown item tooltip. It will be used if {@link DropdownItem._tooltipLabelKey} is not present.
     */
    private _tooltipLabelKey;
    /**
     * Specifies the events that trigger the dropdown item tooltip to appear. Multiple event names should be separated by spaces.
     */
    private _dropdownTooltipTrigger;
    /**
     * Icon class for the main dropdown button.
     */
    private _iconClass;
    /**
     * Path or URL to the image used as icon an item of dropdown button.
     */
    private _iconImage;
    /**
     * The value of dropdown item. It will be emitted when the item is selected.
     * @private
     */
    private _value;
    /**
     * Custom css classes for the dropdown item.
     * @private
     */
    private _cssClass;
    /**
     * The value of the `guide-selector` attribute for a dropdown item.
     * @private
     */
    private _guideSelector;
    get name(): string;
    setName(value: string): this;
    get nameLabelKey(): string;
    setNameLabelKey(value: string): this;
    get tooltip(): string | Awaitable<string>;
    setTooltip(value: string | Awaitable<string>): this;
    get tooltipLabelKey(): string;
    setTooltipLabelKey(value: string): this;
    get iconClass(): string;
    setIconClass(value: string): this;
    get iconImage(): string;
    setIconImage(value: string): this;
    get value(): T;
    setValue(value: T): this;
    get dropdownTooltipTrigger(): string;
    setDropdownTooltipTrigger(value: string): this;
    get cssClass(): string;
    setCssClass(value: string): this;
    get guideSelector(): string;
    setGuideSelector(value: string): this;
}
