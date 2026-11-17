import { Model } from '../common';
import { SuggestionType } from './suggestion-type';
/**
 * Represents a suggestion in the RDF search functionality.
 */
export declare class Suggestion extends Model<Suggestion> {
    /** Unique identifier for the suggestion. */
    private _id?;
    /** The type of the suggestion. */
    private _type;
    /** The value of the suggestion. */
    private _value;
    /** A description of the suggestion. */
    private _description?;
    /** Whether the suggestion is hovered. The hovered suggestion is the subject of action on key press */
    private _hovered?;
    /** Under some conditions (holding ctrlKey/metaKey, when selecting) the suggestion needs to be opened in
     * the Graph visualization view, regardless, of the selected mode
     */
    private overrideToVisual;
    /** Whether the suggestion has been selected. When clicked, the suggestion will be selected */
    private _selected?;
    constructor(data: {
        id?: number;
        type: SuggestionType;
        value: string;
        description?: string;
    });
    getId(): number | undefined;
    setId(id?: number): void;
    getType(): SuggestionType;
    setType(type: SuggestionType): void;
    getValue(): string;
    setValue(value: string): void;
    getDescription(): string | undefined;
    setDescription(description?: string): void;
    isHovered(): boolean | undefined;
    setHovered(hovered: boolean): void;
    isSelected(): boolean | undefined;
    setSelected(selected: boolean): void;
    getOverrideToVisual(): boolean;
    setOverrideToVisual(override: boolean): void;
}
