import { LoggerType } from './logger-type';
import { Logger } from './logger';
/**
 * A mapping of available logger types to their corresponding logger service instances.
 * Adding loggers here will initialize them and make them available for use in the application.
 **/
export declare const LOGGER_DEFINITIONS: Map<LoggerType, Logger>;
