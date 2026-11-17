import { Suggestion } from './suggestion';
/**
 * Event payload for when a suggestion is selected.
 */
export declare class SuggestionSelectedPayload {
    private suggestion;
    private context;
    constructor(suggestion: Suggestion, context: string);
    getSuggestion(): Suggestion;
    getContext(): string;
    setContext(context: string): void;
    setSuggestion(suggestion: Suggestion): void;
}
