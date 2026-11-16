export type DialogConfig = {
    dialogTitle: string;
    onClose?: (evt: MouseEvent | KeyboardEvent) => void;
    modalClass?: string;
};
export declare class OntoDialog {
    private documentOverflow;
    hostElement: HTMLElement;
    /**
     * Configuration object for the dialog.
     */
    config: DialogConfig;
    componentDidLoad(): void;
    disconnectedCallback(): void;
    render(): any;
    private handleClose;
    private preventLeavingDialog;
}
