import { Service } from '../../../providers/service/service';
import { InteractiveGuide } from '../../../models/interactive-guide/interactive-guide';
export declare class GuidesService implements Service {
    private readonly shepherdService;
    private readonly toastrService;
    private readonly repositoryContextService;
    private readonly guideApi;
    private readonly guideContextService;
    private readonly guidesRestService;
    /**
     * Creates a guide and starts it from <code>startStepId</code> if provided. Starts from the beginning otherwise.
     *
     *
     * Steps:
     * 1. Shows an error toast if the guide is not found;
     * 2. Adds index incrementation to the guide repository ID if it already exists in the repository context to ensure uniqueness;
     * 3. Converts complex steps to core steps;
     * 4. Starts or resumes the guide via ShepherdService.
     *
     * @param guide - The guide to start.
     * @param services the services passed to the steps
     * @param startStepId - The step ID to start from. If defined, the guide will be resumed from that step.
     * @param isAutoStarted - Whether the guide was automatically started.
     */
    startGuide(guide: InteractiveGuide | undefined, services: Record<string, any>, startStepId?: string, isAutoStarted?: boolean): void;
    /**
     * Fetches the list of all available guides and maps them to models.
     *
     * @returns A Promise that resolves to an array of {@link InteractiveGuide} objects.
     */
    getGuides(): Promise<InteractiveGuide[]>;
    /**
     * Automatically starts a guide by its ID.
     * Fetches all guides, finds the one matching the given ID, and starts it.
     * If the ID is a number, it is coerced to a string before matching.
     *
     * @param autoStartGuideId - The ID of the guide to auto-start.
     * @param services - The services passed to the guide steps.
     */
    autoStartGuide(autoStartGuideId: string | number, services: Record<string, any>): void;
    /**
     * Returns whether scrolling is allowed during the current guide state.
     * Scrolling is allowed when no guide is active or when the current step explicitly permits it.
     */
    isScrollingAllowed(): boolean;
    /**
     * Returns whether the guide is currently active.
     */
    isActive(): boolean;
}
