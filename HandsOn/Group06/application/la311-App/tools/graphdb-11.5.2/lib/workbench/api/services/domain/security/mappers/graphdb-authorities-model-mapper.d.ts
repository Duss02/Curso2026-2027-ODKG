import { GraphdbAuthoritiesModel } from '../../../../models/security/authorization/graphdb-authorities-model';
import { AuthorityList } from '../../../../models/security';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
export declare const mapGraphdbAuthoritiesResponseToModel: MapperFn<AuthorityList, GraphdbAuthoritiesModel>;
