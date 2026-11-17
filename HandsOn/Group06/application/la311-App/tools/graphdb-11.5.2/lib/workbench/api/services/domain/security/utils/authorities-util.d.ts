import { Authority } from '../../../../models/security/authorization/authority';
export interface RepoAuthority {
    prefix: Authority;
    repo: string;
}
export declare class AuthoritiesUtil {
    /**
     * Given an authority string, returns an object with the prefix used and the repository id.
     * Returns null if the authority does not start with a known repo prefix.
     *
     * @param role - The authority code, expected to start with a known prefix.
     * @returns A RepoAuthority object or null if no known prefix matches.
     */
    static getRepoFromAuthority(role: string): RepoAuthority | null;
}
