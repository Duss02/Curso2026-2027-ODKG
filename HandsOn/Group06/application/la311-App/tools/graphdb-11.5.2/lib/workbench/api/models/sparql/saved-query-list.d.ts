import { ModelList } from '../common';
import { SavedQuery } from './saved-query';
export declare class SavedQueryList extends ModelList<SavedQuery> {
    constructor(items?: SavedQuery[]);
    getFirstQuery(): SavedQuery | undefined;
}
