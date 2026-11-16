import { HttpService } from '../../http/http.service';
import { UserResponse } from './response/user-response';
import { UserRequest } from './response/user-request';
export declare class UsersRestService extends HttpService {
    private readonly SECURITY_ENDPOINT;
    private readonly SECURITY_USER_ENDPOINT;
    getUser(username: string): Promise<UserResponse>;
    getUsers(): Promise<UserResponse[]>;
    createUser(username: string, userRequest: UserRequest): Promise<void>;
    updateUser(username: string, userRequest: UserRequest): Promise<void>;
    updateCurrentUser(username: string, userRequest: UserRequest): Promise<void>;
    deleteUser(username: string): Promise<void>;
}
