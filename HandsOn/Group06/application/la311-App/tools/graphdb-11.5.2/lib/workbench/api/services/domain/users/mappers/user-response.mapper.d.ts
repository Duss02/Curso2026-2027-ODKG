import { User } from '../../../../models/users';
import { UserResponse } from '../response/user-response';
import { MapperFn } from '../../../../providers/mapper/mapper-fn';
export declare const mapUserResponseToModel: MapperFn<UserResponse, User>;
