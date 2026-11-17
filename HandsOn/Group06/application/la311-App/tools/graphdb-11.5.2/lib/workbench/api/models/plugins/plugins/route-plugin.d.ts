import { Plugin } from './plugin';
/**
 * Represents a route plugin item in the application's routing system.
 * This class encapsulates all properties needed to define a route
 * including its URL, associated module, controller, and access permissions.
 */
export declare class RoutePlugin extends Plugin {
    private _url;
    private _module;
    private _path;
    private _chunk;
    private _controller;
    private _templateUrl;
    private _title?;
    private _reloadOnSearch?;
    private _helpInfo?;
    private _documentationUrl?;
    private _allowAuthorities?;
    constructor(routeItem: Partial<RoutePlugin>);
    get url(): string;
    set url(url: string);
    get module(): string;
    set module(module: string);
    get path(): string;
    set path(path: string);
    get chunk(): string;
    set chunk(chunk: string);
    get controller(): string;
    set controller(controller: string);
    get templateUrl(): string;
    set templateUrl(templateUrl: string);
    get title(): string | undefined;
    set title(title: string);
    get reloadOnSearch(): boolean | undefined;
    set reloadOnSearch(reloadOnSearch: boolean | undefined);
    get helpInfo(): string | undefined;
    set helpInfo(helpInfo: string);
    get documentationUrl(): string | undefined;
    set documentationUrl(documentationUrl: string | undefined);
    get allowAuthorities(): string[] | undefined;
    set allowAuthorities(allowAuthorities: string[]);
}
