import { AuthenticatedUser, SecurityConfig } from "../../../../api/dist/ontotext-workbench-api";
/**
 * This component displays the current user's name and provides options
 * for navigating to settings and logging out.
 */
export declare class OntoUserMenu {
    private readonly authenticationService;
    /** Whether the dropdown menu is open or closed */
    private isOpen;
    /** Currently authenticated user */
    user: AuthenticatedUser;
    /** Current security config */
    securityConfig: SecurityConfig;
    /** Reference to host element for outside click detection */
    hostElement: HTMLElement;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): any;
    /**
    * Log out the current user.
    */
    private readonly logout;
    /**
     * Toggles the dropdown menu's open state.
     *
     * @returns A function that toggles the `isOpen` state between true and false.
     */
    private readonly toggleDropdown;
    /**
     * Closes the dropdown if the user clicks outside the component.
     */
    private readonly handleOutsideClick;
}
