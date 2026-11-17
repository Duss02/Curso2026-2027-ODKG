import { ModelList } from '../common';
/**
 * Represents a pair of a regular expression and its associated route parameters.
 * This class is used for route matching and parameter extraction for the plugin system.
 */
export declare class RouteRegexParamPair {
    private regex;
    private routeParams;
    constructor(regex: RegExp, routeParams: ModelList<string>);
    getRegex(): RegExp;
    setRegex(regex: RegExp): RouteRegexParamPair;
    getRouteParams(): ModelList<string>;
    setRouteParams(routeParams: ModelList<string>): RouteRegexParamPair;
}
