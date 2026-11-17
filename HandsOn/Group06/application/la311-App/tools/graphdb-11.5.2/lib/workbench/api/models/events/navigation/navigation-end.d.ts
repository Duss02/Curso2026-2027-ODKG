import { Event } from '../event';
import { NavigationEndPayload } from './navigation-end-payload';
/**
 * Represents a "navigationEnd" event.
 *
 * This event is triggered when navigation ends and contains information about the previous and current URLs.
 */
export declare class NavigationEnd extends Event<NavigationEndPayload> {
    constructor(oldUrl: string, newUrl: string);
}
