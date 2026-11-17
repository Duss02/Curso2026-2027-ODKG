import { AuthorityList } from '../../../../models/security/authorization/authority-list';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
/**
 * Mapper for converting an array of authority strings into an AuthorityList model.
 *
 * This class handles suffix-delimited authorities (e.g. "READ_REPO_ABC:GRAPHQL"),
 * extracting repository-specific GraphQL rights and including both the base and UI-specific authorities.
 */
export declare const mapGrantedAuthoritiesResponseToModel: MapperFn<string[] | AuthorityList, AuthorityList>;
