import { SearchButtonList } from './search-button-list';
import { SearchButton } from './search-button';
import { Model } from '../common';
/**
 * Represents the configuration for search buttons.
 */
export declare class SearchButtonConfig extends Model<SearchButtonConfig> {
    /** Indicates whether the buttons should behave as radio buttons. */
    private radio;
    /** The list of search buttons. */
    private buttons;
    constructor(data: {
        isRadio: boolean;
        buttons: SearchButton[];
    });
    getButtons(): SearchButtonList;
    setButtons(buttons: SearchButtonList): void;
    isRadio(): boolean;
    setRadio(isRadio: boolean): void;
    selectButton(button: SearchButton): SearchButtonConfig;
    private deselectAll;
}
