import { OpenIdError } from './openid-error';
export declare class InvalidOpenidAuthFlow extends OpenIdError {
    constructor(authFlow?: string);
}
