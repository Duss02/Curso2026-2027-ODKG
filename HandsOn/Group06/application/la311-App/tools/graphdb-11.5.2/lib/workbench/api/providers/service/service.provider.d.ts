import { Service } from './service';
/**
 * Service provider for all {@link Service} instances. Services in the API are singletons, meaning that there is only
 * one instance of each service in the application. This provider caches all workbench services created on demand,
 * ensuring that all micro frontends share a single instance of each service.
 */
export declare class ServiceProvider {
    /**
       * The static modifier ensures the map is the same for all ServiceProviders. Each micro-frontend will have its
       * own instance of {@see ServiceFactoryService}, but the map with instances will be shared.
       */
    private static readonly SERVICE_INSTANCES;
    /**
     * Returns the instance of the given service type. If the service has not been created yet, this method:
     *   1. Instantiates the service via `new type()`.
     *   2. Calls its `onCreated()` hook if implemented.
     *   3. Caches and returns the instance.
     *
     * @param type The service type to retrieve.
     * @returns The instance of the service.
     * @template T The type of the service to retrieve.
     */
    static get<T extends Service>(type: {
        new (): T;
    }): T;
    private static implementsLifecycleHooks;
    /**
     * Returns all instances of the given service type.
     * @param superType The super type of the services to retrieve.
     * @returns All instances of the given service type.
     * @template T The super type of the services to retrieve.
     */
    static getAllBySuperType<T>(superType: abstract new (service: T) => T): T[];
}
