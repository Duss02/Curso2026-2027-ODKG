import { EventEmitter } from '../../stencil-public-runtime';
import { DropdownItem } from '../../models/dropdown/dropdown-item';
import { GraphExploreEvent } from './models/graph-explore-types';
import { GraphConfig } from "../../../../api/dist/ontotext-workbench-api";
/**
 * Split button component for exploring graphs based on available configurations.
 *
 * The component loads graph configurations, presents them as dropdown items, and emits a {@link GraphExploreEvent}
 * when the primary button is clicked or a specific configuration is selected.
 */
export declare class OntoGraphExploreSplitButton {
    private readonly logger;
    /**
     * Label displayed on the primary action button.
     */
    label: string;
    /**
     * Callback invoked when the dropdown is opened to fetch graph configurations.
     *
     */
    fetchGraphConfigs: () => Promise<GraphConfig[]>;
    /**
     * Dropdown items representing available graph configurations.
     */
    items: DropdownItem<GraphConfig>[];
    /**
     * Flag indicating whether the dropdown is open.
     */
    isDropdownOpen: boolean;
    /**
     * Emitted when the user triggers a graph exploration action.
     *
     * - `action: 'default' - when the main button is clicked.
     * - `action: 'select' - when a dropdown menu item is selected.
     * - `action: 'create' - when the create graph link is clicked.
     *
     * `graphConfig` is provided when a specific configuration is selected.
     */
    graphExplore: EventEmitter<GraphExploreEvent>;
    componentWillLoad(): void;
    /**
     * Handles changes to the dropdown open/close state.
     *
     * @param event - Custom event containing the dropdown state (`isOpen` flag)
     */
    private dropdownToggledHandler;
    /**
     * Emits a graph exploration event based on the user interaction source.
     *
     * @param action - The type of exploration action:
     * - `default`: triggered by primary button click
     * - `select`: triggered by selecting a dropdown menu item
     * - `create`: triggered when navigating to create a graph view
     *
     * @param graphConfig - Optional graph configuration associated with the selected item.
     */
    private emitGraphExplore;
    /**
     * Fetches graph configurations and maps them to dropdown items. Populates `this.items` with the result
     * or a fallback list if no data is returned or the request fails.
     */
    private loadGraphConfigItems;
    render(): any;
    private readonly handleDefaultClick;
    private readonly handleToggle;
    private readonly handleValueChanged;
    private readonly handleCreateClick;
}
