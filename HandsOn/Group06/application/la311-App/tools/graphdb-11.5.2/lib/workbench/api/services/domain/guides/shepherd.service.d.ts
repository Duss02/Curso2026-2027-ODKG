import type Step from 'shepherd.js/src/types/step';
import { Service } from '../../../providers/service/service';
import { GuideStep } from '../../../models/interactive-guide/guide-step';
export type GuideEndListener = () => void;
export type UnsubscribeFunction = () => void;
/**
 * Service wrapper around the <a href="https://shepherdjs.dev/docs/">Shepherd.js</a> tour library.
 *
 * Manages the lifecycle of an interactive guide: creating, starting, pausing, resuming, navigating
 * between steps, and persisting state via {@link GuideStorageService}.
 */
export declare class ShepherdService implements Service {
    private readonly logger;
    private readonly toastrService;
    private readonly guideApi;
    private readonly guideStorage;
    private guideCancelSubscription;
    private guideCompleteSubscription;
    private guideAutostarted;
    onPause: () => void;
    private endSubscribers;
    /**
     * Creates and starts a guide.
     *
     * @param guideId - Unique ID that identifies the guide.
     * @param stepsDescriptions - Array with core step descriptions.
     * @param startStepId - Step ID to start from. If absent the guide starts from the beginning.
     * @param isAutoStarted - Whether the guide was automatically started.
     * @param clearHistory - If true, clears the step history before starting.
     */
    startGuide(guideId: string, stepsDescriptions: GuideStep[] | undefined, startStepId?: string, isAutoStarted?: boolean, clearHistory?: boolean): void;
    /**
     * Resumes a guide from the step where it was paused.
     */
    resumeGuide(guideId: string, stepsDescriptions: GuideStep[], startStepId?: string): void;
    /**
     * Returns whether a guide is currently active (started and not paused).
     */
    isActive(): boolean;
    /**
     * Returns whether the guide is currently paused.
     */
    isPaused(): boolean;
    /**
     * Returns the ID of the currently active guide, or `null` if no guide is active.
     */
    getGuideId(): string | null;
    /**
     * Returns the ID of the current step in the active guide, or `null` if unavailable.
     */
    getCurrentStepId(): string | null;
    /**
     * Returns whether scrolling is allowed. Scrolling is allowed when no guide is active
     * or when the current step explicitly permits it via the `allowScroll` option.
     */
    isScrollingAllowed(): boolean;
    /**
     * Registers a callback to be invoked when the active guide ends, regardless of whether it is completed, cancelled, or terminated unexpectedly.
     *
     * @param subscriber - The callback to invoke when cancellation is requested.
     * @returns A function that unregisters the subscriber. Calling the returned function multiple times has no effect.
     */
    subscribeOnGuideEnd(subscriber: GuideEndListener): UnsubscribeFunction;
    /**
     * Registers a callback to be invoked when the active guide is paused.
     *
     * @param onPause - Callback function to call on guide pause.
     */
    subscribeToGuidePause(onPause: () => void): void;
    /**
     * Returns the Shepherd {@link Step} that precedes the given step ID in the navigation history,
     * or `undefined` if there is no previous step.
     *
     * @param stepId - The ID of the step whose predecessor should be retrieved.
     */
    getPreviousStepFromHistory(stepId: string): Step | undefined;
    private createGuide;
    private addGuideSteps;
    private doStartGuide;
    private subscribeToGuideCanceled;
    private getFirstStep;
    private getMiddleStep;
    private getLastStep;
    private toGuideStep;
    private toBaseGuideStep;
    private getBeforeShowPromise;
    private getShowFunction;
    private whenStepShow;
    private getBackToGuidesButton;
    private getCancelButton;
    private getSkipButton;
    private getPreviousButton;
    private getNextButton;
    private getButton;
    private getPreviousButtonAction;
    private getNextButtonAction;
    private backToGuides;
    private confirmGuideCancel;
    private completeGuide;
    private abortGuide;
    private pauseGuide;
    private skipSteps;
    private getNextSkipPointId;
    private getStepWhichCanBePaused;
    private updateLocalStorage;
    private toParagraph;
    private addTotalProgress;
    private addTypeIcon;
    private isDisablePreviousFlow;
    private isDisableNextFlow;
}
