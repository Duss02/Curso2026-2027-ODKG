import { RoutePlugin } from '../../models/plugins';
import { Service } from '../../providers/service/service';
/**
 * Service responsible for handling application routing functionality.
 *
 * This service provides methods for matching URL paths against registered routes,
 * converting route patterns to regular expressions, and retrieving active routes.
 * It works with the application's route configuration obtained from the PluginRegistry.
 */
export declare class RoutingService implements Service {
    private readonly routePlugins;
    /**
     * Finds and returns the active route based on the provided path.
     * Compares the path against registered routes in the route configuration
     * and returns the first matching route as a RouteItemModel.
     *
     * @param path - The URL path to match against registered routes.
     * @returns A RouteItemModel instance representing the matched route,
     *          or undefined if no matching route is found.
     */
    getActiveRoute(path: string): RoutePlugin | undefined;
    /**
     * Converts a route path string to a regular expression for route matching.
     * Handles route parameters with various options (optional, wildcard).
     *
     * @param path - The route path pattern to convert (e.g., '/users/:id', '/items/:name?')
     * @returns A RouteRegexParamPair containing the compiled regular expression
     *          and a list of parameter names extracted from the path.
     */
    private routeToRegex;
}
