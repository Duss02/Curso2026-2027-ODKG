import { Plugin } from './plugin';
/**
 * Represents a main menu plugin item in the application.
 */
export declare class MainMenuPlugin extends Plugin {
    private _items;
    constructor(mainMenuPlugin: Partial<MainMenuPlugin>);
    get items(): MainMenuItem[];
    set items(value: MainMenuItem[]);
}
/**
 * Represents an item in the main menu of the application.
 */
export declare class MainMenuItem {
    private _label;
    private _labelKey;
    private _href;
    private _documentationHref?;
    private _children?;
    private _icon?;
    private _guideSelector?;
    private _editions?;
    private _role?;
    private _parent?;
    private _hrefFun?;
    private _shouldShow?;
    private _testSelector?;
    private _order;
    private _priority;
    constructor(mainMenuItems: Partial<MainMenuItem>);
    get label(): string;
    set label(value: string);
    get labelKey(): string;
    set labelKey(value: string);
    get href(): string;
    set href(value: string);
    get documentationHref(): string | undefined;
    set documentationHref(value: string | undefined);
    get children(): MainMenuItem[] | undefined;
    set children(value: MainMenuItem[] | undefined);
    get icon(): string | undefined;
    set icon(value: string | undefined);
    get guideSelector(): string | undefined;
    set guideSelector(value: string | undefined);
    get editions(): string | undefined;
    set editions(value: string | undefined);
    get role(): string | undefined;
    set role(value: string | undefined);
    get parent(): string | undefined;
    set parent(value: string | undefined);
    get hrefFun(): string | undefined;
    set hrefFun(value: string | undefined);
    get shouldShow(): boolean | undefined;
    set shouldShow(value: boolean | undefined);
    get testSelector(): string | undefined;
    set testSelector(value: string | undefined);
    get order(): number;
    set order(value: number);
    get priority(): number;
    set priority(value: number);
}
