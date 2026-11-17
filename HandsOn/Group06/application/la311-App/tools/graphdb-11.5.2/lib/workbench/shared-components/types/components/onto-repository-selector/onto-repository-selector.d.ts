import { Repository, RepositoryPermissionType, RepositorySizeInfo } from "../../../../api/dist/ontotext-workbench-api";
import { DropdownItem } from '../../models/dropdown/dropdown-item';
export declare class OntoRepositorySelector {
    private readonly repositoryContextService;
    private readonly subscriptions;
    /**
     * The currently selected repository.
     */
    currentRepository: Repository;
    /**
     * The list of repositories to show in the dropdown.
     */
    items: DropdownItem<Repository>[];
    /**
     * Fetches repository size info used to build tooltips.
     */
    repositorySizeInfoFetcher: (repo: Repository) => Promise<RepositorySizeInfo>;
    /**
     * Formatter for numeric values in tooltips.
     */
    totalTripletsFormatter: Intl.NumberFormat;
    /**
     * Formatter for numeric values with fraction in tooltips.
     */
    expansionRatioFormatter: Intl.NumberFormat;
    /**
     * Determines whether the current user has write access to the repository.
     */
    getRepositoryPermission: (repository: Repository) => RepositoryPermissionType;
    /**
     * The default name of the toggle button that will be displayed in the dropdown.
     */
    defaultToggleButtonName: string;
    /**
     * The message to display when there are no repositories available.
     */
    noRepositoriesButtonMessage: string;
    /**
     * A list derived from the `items` input prop, with tooltip functions attached.
     *
     * Tooltip generation is centralized here to ensure consistency and avoid redundant operations.
     */
    private dropdownItems;
    /**
     * Re-applies tooltip functions to all dropdown items when the items prop changes.
     */
    onItemsChanged(newItems: DropdownItem<Repository>[]): void;
    connectedCallback(): void;
    /**
     * Cleans up the subscriptions when the component is removed from the DOM to avoid memory leaks.
     * This method unsubscribes from both the repository change and selected repository change events.
     */
    disconnectedCallback(): void;
    render(): any;
    private attachTooltipsToItems;
    private tooltipAlignment;
    private onValueChanged;
    /**
     * Returns an async function that generates HTML tooltip content for the given repository.
     */
    private createTooltipFunctionForRepository;
    /**
     * Builds the complete HTML string used as tooltip content for a repository.
     */
    private buildRepositoryTooltipHtml;
    /**
     * Builds the repository size section of the tooltip.
     */
    private buildRepositorySizeInfoHtml;
    private subscribeToTranslationChanged;
    private onRepositoryChanged;
    private getLocation;
    private getButtonLabel;
}
