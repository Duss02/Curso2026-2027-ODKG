import { ConfirmCancelPayload } from "../../../../../api/dist/ontotext-workbench-api";
export declare class OntoConfirmCancelDialog {
    private isOpen;
    private hasDontShowAgain;
    private onClose;
    onConfirmCancelEvent(event: CustomEvent<ConfirmCancelPayload>): void;
    render(): any;
    private readonly onCancel;
    private readonly onExit;
    private readonly onDontShowAgain;
    private resolve;
}
