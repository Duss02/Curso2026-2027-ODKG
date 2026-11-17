export declare class OntoLoader {
    loader: HTMLElement;
    /**
     * Size of the loader in pixels (width and height).
     */
    size: number;
    /**
     * Whether the loader is currently active and should be displayed.
     */
    loading: boolean;
    /**
     * Optional message text to display below the loader.
     */
    messageText: string;
    /**
     * CSS selector of a DOM element to attach the loader to as a centered overlay.
     */
    targetSelector: string;
    private readonly ATTACHED_CLASS;
    private readonly rawSvg;
    private readonly logger;
    componentDidLoad(): void;
    render(): any;
    private attachToSelector;
}
