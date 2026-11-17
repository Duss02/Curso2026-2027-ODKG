import { Notification } from '../../../models/notification';
import { ToastMessage } from '../../../models/toastr';
/**
 * Mapper class for mapping OntoNotification to ToastMessage.
 */
export declare class OntoToastrMapper {
    private constructor();
    /**
     * Maps OntoNotification to ToastMessage.
     * @param notification - OntoNotification to be mapped.
     */
    static fromNotification(notification: Notification): ToastMessage;
    private static notificationTypeToToastType;
    private static toTranslationParams;
}
