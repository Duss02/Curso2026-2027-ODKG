import { CancelDialogAction } from './cancel-dialog-action';
export type ConfirmCancelCallback = (action: CancelDialogAction) => void;
export declare class ConfirmCancelPayload {
    readonly hasDontShowAgain: boolean;
    readonly onClose: ConfirmCancelCallback;
    constructor(hasDontShowAgain: boolean, onClose: ConfirmCancelCallback);
}
