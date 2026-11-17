import { Service } from '../../../providers/service/service';
import { User } from '../../../models/users';
export declare class UsersService implements Service {
    static readonly ADMIN_USERNAME = "admin";
    private readonly usersRestService;
    /**
     * Retrieves a user by username from the backend.
     * The full response is mapped to convert its data property to a UI model.
     *
     * @param username - The username of the user to retrieve.
     * @returns A promise that resolves to the User model.
     */
    getUser(username: string): Promise<User>;
    /**
     * Retrieves all users from the backend.
     * Each user in the response is mapped to convert its data property to a UI model.
     *
     * @returns A promise that resolves to an array of User models.
     */
    getUsers(): Promise<User[]>;
    /**
     * Retrieves the admin user from the backend.
     * The full response is mapped to convert its data property to a UI model.
     *
     * @returns A promise that resolves to the User model of the admin user.
     */
    getAdminUser(): Promise<User>;
    /**
     * Creates a new user in the backend.
     * The user data is mapped to the appropriate request format before sending.
     * @param user
     */
    createUser(user: User): Promise<void>;
    /**
     * Updates an existing user in the backend.
     * The user data is mapped to the appropriate request format before sending.
     * @param user
     */
    updateUser(user: User): Promise<void>;
    /**
     * Deletes a user from the backend by username.
     * @param username
     */
    deleteUser(username: string): Promise<void>;
    /**
     * Updates the current user's information in the backend.
     * The user data is mapped to the appropriate request format before sending.
     * @param user - The current user to update.
     */
    updateCurrentUser(user: User): Promise<void>;
}
