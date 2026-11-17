import { User } from '../../../../models/users';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
import { UserRequest } from '../response/user-request';
export declare const mapUserModelToRequest: MapperFn<User, UserRequest>;
