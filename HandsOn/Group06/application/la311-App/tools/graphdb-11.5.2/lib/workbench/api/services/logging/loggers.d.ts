import { LoggerService } from './logger-service';
/**
 * Static factory class for managing logger instances across different modules.
 * Implements a singleton pattern to ensure one logger instance per module.
 */
export declare class Loggers {
    private static readonly loggerInstances;
    /**
     * Gets or creates a logger instance for the specified module.
     *
     * @param module - The module to get a logger for
     * @returns LoggerService instance for the module
     */
    static getLoggerInstance(module: string): LoggerService;
}
