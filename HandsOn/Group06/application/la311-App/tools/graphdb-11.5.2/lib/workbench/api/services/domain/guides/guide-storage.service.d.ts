import { LocalStorageService } from '../../storage';
/**
 * Service that handles the guide-related properties in the local storage.
 * Manages guide state persistence including current step, step history, pause state, and autostart preferences.
 */
export declare class GuideStorageService extends LocalStorageService {
    readonly NAMESPACE = "guides";
    private readonly GUIDE_ID;
    private readonly CURRENT_STEP_ID;
    private readonly STEP_HISTORY;
    private readonly PAUSE;
    private readonly AUTOSTART;
    set(key: string, value: string): void;
    /**
     * Returns the ID of the currently active guide.
     */
    getGuideId(): string | null;
    /**
     * Stores the ID of the currently active guide.
     * @param guideId - The guide ID to persist.
     */
    setGuideId(guideId: string): void;
    /**
     * Returns the ID of the current step in the active guide.
     */
    getCurrentStepId(): string | null;
    /**
     * Stores the ID of the current step.
     * @param stepId - The step ID to persist.
     */
    setCurrentStepId(stepId: string): void;
    /**
     * Returns the step history as an array of step IDs.
     */
    getHistory(): string[];
    /**
     * Adds a step ID to the end of the step history.
     * @param stepId - The step ID to append.
     */
    addStepToHistory(stepId: string): void;
    /**
     * Removes the last step ID from the step history.
     */
    removeLastStepFromHistory(): void;
    /**
     * Returns the previous step ID from the history relative to the given step ID.
     * If no step ID is provided, returns the second-to-last entry in the history.
     *
     * @param stepId - Optional step ID to find the predecessor of.
     * @returns The previous step ID, or `undefined` if there is no previous step.
     */
    getPreviousStepIdFromHistory(stepId?: string): string | undefined;
    /**
     * Clears the step history.
     */
    clearHistory(): void;
    /**
     * Returns whether the guide is currently paused.
     */
    isPaused(): boolean;
    /**
     * Marks the guide as paused.
     */
    setPaused(): void;
    /**
     * Clears the pause state.
     */
    clearPaused(): void;
    /**
     * Persists the current guide and step IDs so the guide can be resumed later.
     * @param guideId - The guide ID.
     * @param stepId - The current step ID.
     */
    saveStep(guideId: string, stepId: string): void;
    /**
     * Returns whether autostart is disabled for the given guide.
     * @param guideId - The guide ID to check.
     */
    isAutostartDisabled(guideId: string): boolean;
    /**
     * Disables autostart for the given guide.
     * @param guideId - The guide ID for which to disable autostart.
     */
    disableAutostart(guideId: string): void;
    /**
     * Removes all guide-related data from local storage.
     */
    clearAll(): void;
}
