import { Service } from '../../../providers/service/service';
import { CancelDialogAction } from '../../../models/dialog/cancel-dialog-action';
/**
 * Service that opens a cancel confirmation dialog and returns the user's choice.
 *
 * Communicates with the `onto-confirm-cancel-dialog` Stencil component via a DOM event,
 * following the same pattern as {@link OntoToastrService}.
 */
export declare class DialogService implements Service {
    private readonly eventEmitter;
    /**
     * Emits a confirm-cancel dialog event and returns a promise that resolves
     * with the user's choice once the dialog is interacted with.
     *
     * @param hasDontShowAgain - Whether to show the "Don't show again" button.
     * @returns A promise that resolves with the user's action.
     */
    confirmCancel(hasDontShowAgain: boolean): Promise<CancelDialogAction>;
}
