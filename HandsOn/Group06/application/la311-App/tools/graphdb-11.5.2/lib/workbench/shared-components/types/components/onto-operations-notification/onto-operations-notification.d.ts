import { OperationStatusSummary } from "../../../../api/dist/ontotext-workbench-api";
export declare class OntoOperationsNotification {
    el: HTMLElement;
    /** The active operations summary. Holds general status and all current operations */
    activeOperations: OperationStatusSummary;
    /** Whether the dropdown menu is open or closed */
    isOpen: boolean;
    /** Grouped info about operations, to be displayed in the button */
    private operationGroups;
    handleOutsideClick(): void;
    render(): any;
    private toggleDropdown;
}
