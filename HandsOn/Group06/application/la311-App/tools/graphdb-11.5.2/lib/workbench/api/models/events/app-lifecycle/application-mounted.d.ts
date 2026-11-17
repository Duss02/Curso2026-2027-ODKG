import { Event } from '../event';
/**
 * Event emitted when the application has been successfully mounted.
 * This is our event that doesn't rely on single-spa because their events are not reliable.
 */
export declare class ApplicationMounted extends Event<undefined> {
    constructor();
}
