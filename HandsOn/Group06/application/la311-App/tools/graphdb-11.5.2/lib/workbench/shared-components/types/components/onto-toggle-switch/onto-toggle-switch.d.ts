import { EventEmitter } from '../../stencil-public-runtime';
import { ToggleEventPayload } from '../../models/toggle-switch/toggle-event-payload';
export declare class OntoToggleSwitch {
    private readonly subscriptions;
    private tooltipLabel;
    /**
     * Determines whether the toggle switch is checked or not.
     */
    checked: boolean;
    /**
     * The key used for translating the label text, if supplied.
     */
    labelKey?: string;
    /**
     * The translation label key for the tooltip message, if supplied.
     */
    tooltipTranslationKey?: string;
    /**
     * The context for the tooltip, if supplied. This is useful if you have multiple toggle switches, to know which one
     * is being toggled.
     */
    context?: string;
    /**
     * Event emitted when the toggle switch is clicked, carrying the new checked status.
     */
    toggleChanged: EventEmitter<ToggleEventPayload>;
    private readonly toggle;
    private subscribeToLanguageChange;
    disconnectedCallback(): void;
    connectedCallback(): void;
    render(): any;
}
