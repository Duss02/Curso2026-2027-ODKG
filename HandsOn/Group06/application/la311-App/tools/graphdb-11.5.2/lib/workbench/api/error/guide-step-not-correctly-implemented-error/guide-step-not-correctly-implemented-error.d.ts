/**
 * Error thrown when a guide step is not correctly implemented.
 * Each step is expected to have a getStep or getSteps method defined, which returns the step(s) to be executed in the guide.
 * If neither of these methods is implemented, this error is thrown.
 */
export declare class GuideStepNotCorrectlyImplementedError extends Error {
    constructor(stepName: string);
}
