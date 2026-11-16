import { EventEmitter } from '../../stencil-public-runtime';
export declare class OntoDeprecationBanner {
    /**
     * Emitted when the banner is closed.
     */
    closeBanner: EventEmitter<void>;
    private readonly onClose;
    render(): any;
}
