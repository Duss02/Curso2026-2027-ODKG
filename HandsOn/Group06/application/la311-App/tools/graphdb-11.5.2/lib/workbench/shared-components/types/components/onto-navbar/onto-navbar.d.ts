import { EventEmitter } from '../../stencil-public-runtime';
import { NavbarToggledEvent } from './navbar-toggled-event';
import { MainMenuPlugin } from "../../../../api/dist/ontotext-workbench-api";
export declare class OntoNavbar {
    private readonly productInfoContextService;
    private readonly repositoryContextService;
    private readonly subscriptions;
    private readonly resizeHandler;
    private readonly SUBMENU_VERTICAL_MARGIN;
    private readonly MIN_SUBMENU_HEIGHT;
    private labels;
    private productInfo;
    /**
     * Flag indicating whether the navbar is collapsed in result of toggle action initiated by the user. This is needed
     * in cases where the browser window is resized which is an operation that should not override the user's choice
     * regarding the navbar collapsed state, e.g. if the user has manually collapsed the navbar and then resizes the
     * window, the navbar should remain collapsed.
     */
    private isCollapsedByUser;
    private isFirstRepositoryChange;
    hostElement: HTMLOntoNavbarElement;
    /**
     * The internal menu model used for UI rendering.
     */
    private menuModel;
    /**
     * Controls the expanded/collapsed state of the navbar.
     */
    private isCollapsed;
    /**
     * Configuration whether the navbar should be collapsed.
     */
    navbarCollapsed: boolean;
    navbarCollapsedChange(collapsed: boolean): void;
    /**
     * Configuration for the menu items model. This is the external model that is used to build the internal model.
     */
    menuItems: MainMenuPlugin[];
    menuItemsChanged(menuItems: MainMenuPlugin[]): void;
    /**
     * Event fired when the navbar is toggled.
     */
    navbarToggled: EventEmitter<NavbarToggledEvent>;
    private init;
    private select;
    private subscribeToNavigationEnd;
    private selectItemByUrl;
    private toggleNavbar;
    private collapseNavbar;
    private expandNavbar;
    private refreshNavbar;
    private onLanguageChanged;
    private onTranslate;
    private toggleNavbarHandler;
    /**
     * Adjust the max height of a submenu to ensure it fits within the viewport.
     * The submenu will be positioned either below or above its parent menu item based on available space.
     * @param sub The submenu element to adjust.
     * @param margin Margin in pixels to apply when calculating available space. This ensures some space between the
     * submenu and the viewport edge.
     */
    private adjustSubmenuMaxHeight;
    /**
     * Adjust all submenus that are currently open.
     * @param host The host element containing the navbar.
     * @param margin Margin in pixels to apply when calculating available space. This ensures some space between the
     * submenu and the viewport edge.
     */
    private adjustAllSubmenus;
    private getAllOpenedSubmenus;
    private getAllSubmenus;
    private clearAllOpenedSubmenuStyles;
    componentWillLoad(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleSelectMenuItem;
    render(): any;
    private subscribeToProductInfoChanges;
    private subscribeToRepositoryChange;
}
