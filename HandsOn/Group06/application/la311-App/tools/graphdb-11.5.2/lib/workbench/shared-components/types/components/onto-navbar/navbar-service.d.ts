import { NavbarModel } from './navbar-model';
import { ProductInfo, MainMenuPlugin } from "../../../../api/dist/ontotext-workbench-api";
export declare class NavbarService {
    /**
     * Maps external menu plugins to navbar model.
     * @param navbarPlugins Plugin definitions for the main menu.
     * @param productInfo The product info.
     * @param currentRepositoryId The current repository id.
     * @param repositoryIdParamName The name of the repository id query parameter.
     * @returns The navbar model.
     */
    static map(navbarPlugins: MainMenuPlugin[], productInfo: ProductInfo, currentRepositoryId: string, repositoryIdParamName: string): NavbarModel;
    static addRepositoryIdToHrefAttributes(navbarModel: NavbarModel, currentRepositoryId: string, repositoryIdParamName: string): void;
    /**
     * Adds the current repositoryId as a query parameter to href attribute of each menu item which does not have children
     * or documentationHref (external link).
     * @param navbarModel The navbar model.
     * @param currentRepositoryId The current repository id.
     * @param repositoryIdParamName The name of the repository id query parameter.
     */
    private static setTopLevelMenuItems;
    private static setSubmenuItems;
    private static toMenuItemModel;
}
