import { FunctionalComponent } from '../../stencil-public-runtime';
import { Repository } from "../../../../api/dist/ontotext-workbench-api";
interface SelectorItemProps {
    repository: Repository;
}
/**
 *
 * A StencilJS functional component that renders a repository item in the repository selector dropdown. It displays the repository's
 * icon, ID, and location. If no location is specified, it shows "Local" as the default. This component also allows for
 * dynamic rendering of repository details as part of a list of selectable items.
 *
 * @example
 * <SelectorItemButton repository={repository}></>
 *
 */
export declare const SelectorItemButton: FunctionalComponent<SelectorItemProps>;
export {};
