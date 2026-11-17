import { Model } from '../common';
import { StepOptions } from './step-options';
import { GuideStep } from './guide-step';
import { GuidePlugin } from '../plugins/plugins/interactive-guide/guide-plugin';
import { GuideDescription } from './guide-description';
/**
 * Represents an interactive guide, which is a sequence of steps that can be used to guide users through a specific workflow or feature in the application.
 *
 * An `InteractiveGuide` contains a name, description, options, and a list of steps. The steps can be defined directly in the guide or can reference predefined steps provided by `GuidePlugin`s.
 */
export declare class InteractiveGuide extends Model<InteractiveGuide> {
    guideId: string;
    guideName: string;
    guideDescription: GuideDescription;
    options: StepOptions;
    steps: GuideStep[];
    guideLevel?: number;
    guideOrder?: number;
    guideLevelLabel?: string;
    constructor(data: Partial<InteractiveGuide>);
    getId(): string;
    getName(): string;
    getDescription(): Record<string, string> | string;
    getSteps(): GuideStep[];
    getOptions(): StepOptions;
    getTranslatedGuideName(): string | undefined;
    setTranslatedGuideName(name: string): this;
    getTranslatedGuideDescription(): string | undefined;
    setTranslatedGuideDescription(description: string): this;
    getRepositoryId(): string | undefined;
    setRepositoryId(repositoryId: string): this;
    getRepositoryIdBase(): string | undefined;
    setGuideLevelLabel(guideLevelLabel: string): this;
    getGuideLevelLabel(): string | undefined;
    /**
     * Flattens the guide's complex steps into an array of fully resolved {@link GuideStep} objects
     * that the {@link ShepherdService} can consume directly.
     *
     * Each {@link GuideStep} in the guide is matched by its `guideBlockName` against the registered
     * {@link GuidePlugin}s. The plugin's `getStep` or `getSteps` method is called with the merged
     * options to produce the concrete step descriptions. Nested (complex) steps are resolved recursively.
     *
     * @param guidePlugins - The registered guide step plugins that provide individual step implementations.
     * @param services - The bridge services passed through the guide execution context to each plugin step.
     * @returns The flattened array of step descriptions ready for the tour engine.
     */
    toStepsDescriptions(guidePlugins: GuidePlugin[], services: unknown): GuideStep[];
    private _getSteps;
}
