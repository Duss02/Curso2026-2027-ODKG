import { FunctionalComponent } from '../../stencil-public-runtime';
import { Repository } from "../../../../api/dist/ontotext-workbench-api";
interface RepositorySelectionProps {
    repository: Repository;
    defaultToggleButtonName: string;
    location: string;
}
/**
 *
 * A StencilJS component that renders a repository selection. The element displays the repository's icon and ID
 * if a repository is selected; otherwise, it shows a translated toggle button name. The component dynamically
 * updates the name when the translation changes.
 *
 * @example
 * <RepositorySelection repository={repository}></>
 *
 */
export declare const RepositorySelection: FunctionalComponent<RepositorySelectionProps>;
export {};
