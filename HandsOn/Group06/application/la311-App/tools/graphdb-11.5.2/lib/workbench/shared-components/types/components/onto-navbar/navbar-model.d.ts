/**
 * The UI model for the navbar component.
 */
export declare class NavbarModel {
    /**
     * The model is private and should not be accessed directly. Use the provided methods to interact with the model.
     */
    private readonly _items;
    /**
     * Creates a new instance of the navbar model.
     * @param items The model items. If no items are provided, the model will be empty by default.
     */
    constructor(items?: NavbarItemModel[]);
    hasParent(parentLabel: string): boolean;
    /**
     * Clones the model. This method is useful when the model needs to be modified without affecting the original model.
     * @return The cloned model.
     */
    getModel(): NavbarItemModel[];
    /**
     * Adds a new top level item to the model. The sub menu items should be added separately as children before calling
     * this method.
     * @param item The item to be added.
     */
    addItem(item: NavbarItemModel): void;
    /**
     * Returns the selected root item.
     * @return The selected root item or null if no item is selected.
     */
    getSelectedRootItem(): NavbarItemModel | undefined;
    /**
     * Checks if the parent of the provided item is opened.
     * @param item The menu item for which the parent needs to be checked.
     * @return True if the parent is opened, false otherwise. If the item has no parent, the method returns false.
     */
    isParentOpened(item: NavbarItemModel): boolean;
    /**
     * Returns the top level menu item with the given label.
     * @param parent The label of the top level menu item. Each menu item has a label which identifies it in the model.
     * The label comes from the main menu plugin definition and should be unique for each menu item.
     * @return The top level menu item or undefined if no item is found.
     */
    getTopLevelItem(parent: string): NavbarItemModel;
    /**
     * Returns the top level menu item with the same label as the parent property of the provided item.
     * @param item The menu item for which the parent is needed.
     * @return The parent menu item or undefined if no parent is found.
     */
    getParentItem(item: NavbarItemModel): NavbarItemModel;
    /**
     * Deselects all menu items.
     */
    deselectAll(): void;
    /**
     * Closes all opened top level menu items.
     */
    closeAll(): void;
    /**
     * Deselects a top level menu item. When a menu item is selected it is highlighted in the UI.
     * @param item The top level menu item to be deselected.
     */
    deselectItem(item: NavbarItemModel): void;
    /**
     * Selects a top level menu item. When a menu item is selected it is highlighted in the UI.
     * @param item The top level menu item to be selected.
     */
    selectItem(item: NavbarItemModel): void;
    /**
     * Checks if a top level menu item has a selected submenu.
     * @param item The top level menu item to be checked.
     * @return True if the top level menu item has a selected submenu, false otherwise.
     */
    hasSelectedSubmenu(item: NavbarItemModel): boolean;
    /**
     * Recursively checks if any submenu (child or nested) is selected.
     * @param {NavbarItemModel} item - The submenu item to check.
     * @return {boolean} True if selected, or if any descendant is selected.
     */
    private hasSelection;
    /**
     * Marks an opened top level menu item as closed. If the item has a selected submenu, then the top level menu item
     * is marked as selected to indicate that the submenu is active.
     */
    closeOpened(): void;
    /**
     * Opens a top level menu item and closes all other top level menu items.
     * @param item The top level menu item to be opened.
     */
    open(item: NavbarItemModel): void;
    private openItemAndParent;
    /**
     * Closes all top level menu items except the one that is the parent of the current item.
     * @param currentItem The current menu item.
     */
    closeOtherParents(currentItem: NavbarItemModel): void;
    /**
     * Sets the open state of a menu item.
     * @param item The menu item to be updated.
     * @param open The open state to be set.
     */
    setOpen(item: NavbarItemModel, open: boolean): void;
    /**
     * Highlights the selected menu item by selecting its parent if it has one.
     * This is useful when the navbar is collapsed. This operation is the opposite of the unhighlightSelected method.
     */
    highlightSelected(): void;
    /**
     * Unhighlights the selected opened menu item if it has a submenu. This is useful when the navbar is going to be expanded.
     * This operation is the opposite of the highlightSelected method.
     */
    unhighlightSelected(): void;
    /**
     * Finds out the selected menu item. It can be a top level menu item or a submenu item.
     * @return The selected menu item or null if no item is selected.
     */
    getSelectedItem(): NavbarItemModel;
    expandSelected(): void;
    /**
     * Finds out the menu item by its href property and marks it as selected if it is a top level menu. If the menu item
     * is a sub menu, it marks its parent as opened and the sub menu item as selected.
     * @param selectedMenu The href of the menu item to be selected.
     */
    initSelected(selectedMenu: string): void;
    /**
     * Compares a given path against a href pattern that may contain wildcards.
     * This function is used to match menu item hrefs that include wildcard segments.
     *
     * @param path - The actual path to compare against the href pattern.
     * @param href - The href pattern that may contain wildcards ('*').
     * @returns A string representing the matched path. If the path matches the href pattern,
     *          it returns a version of the href where wildcards are preserved. If there's no match,
     *          it returns the original path unchanged.
     */
    private getWildcardPath;
    /**
     * Sorts the menu items by their order property.
     * @return {this} The sorted model.
     */
    sorted(): this;
    private static compare;
    /**
     * Walks recursively through the model and executes the provided callback for each item.
     * @param callback The callback to be executed for each item.
     */
    private walk;
    /**
     * Recursively walks through a list of navbar items and applies the callback.
     * @param items The items to walk through.
     * @param callback The callback to execute on each item.
     */
    private walkRecursively;
    get items(): NavbarItemModel[];
}
/**
 * The model for a single menu item.
 */
export declare class NavbarItemModel {
    private _order;
    private _label;
    private _labelKey;
    private _href;
    private _children;
    private _hasParent;
    private _parent;
    private _selected;
    private _open;
    private _documentationHref;
    private _hrefFun?;
    private _editions?;
    private _icon?;
    private _role?;
    private _guideSelector?;
    private _testSelector?;
    private _shouldShow?;
    private _parentModel?;
    constructor(data: Partial<NavbarItemModel>);
    addChild(child: NavbarItemModel): void;
    addChildren(...children: NavbarItemModel[]): void;
    /**
     * Determines whether the current menu item has submenus.
     * In this context, items with a href value of '#' are treated as parent items
     * and are expected to have submenus. This behavior is due to the fact that
     * all top-level items are registered with href set to '#' when added to the PluginRegistry.
     *
     * @returns {boolean} True if the item is a parent (has submenus), otherwise false.
     */
    hasSubmenus(): boolean;
    get parent(): string;
    set parent(value: string);
    get order(): number;
    set order(value: number);
    get label(): string;
    set label(value: string);
    get labelKey(): string;
    set labelKey(value: string);
    get documentationHref(): string;
    set documentationHref(value: string);
    get href(): string;
    set href(value: string);
    get children(): NavbarItemModel[];
    set children(value: NavbarItemModel[]);
    get hasParent(): boolean;
    set hasParent(value: boolean);
    get selected(): boolean;
    set selected(value: boolean);
    get open(): boolean;
    set open(value: boolean);
    get hrefFun(): string;
    set hrefFun(value: string);
    get editions(): string;
    set editions(value: string);
    get icon(): string;
    set icon(value: string);
    get role(): string;
    set role(value: string);
    get guideSelector(): string;
    set guideSelector(value: string);
    get testSelector(): string;
    set testSelector(value: string);
    get parentModel(): NavbarItemModel;
    set parentModel(value: NavbarItemModel);
    get shouldShow(): boolean;
    set shouldShow(value: boolean);
    private setParent;
}
