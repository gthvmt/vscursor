import * as crypto from 'crypto';
import { URL, URLSearchParams } from "url";
import axios from 'axios';

const API_ROOT = 'https://aicursor.com';
const API_AUDIENCE = 'https://cursor.us.auth0.com/api/v2/';
const CLIENT_ID = 'KbZUR41cY7W6zRSdpSUJ7I7mLYBKOCmB'; //pulled straight from the git repo
const AUTH0_CALLBACK_URL = `${API_ROOT}/auth/auth0_callback`;
const AUTH0_DOMAIN = 'cursor.us.auth0.com';


let accessToken: string | null = null;
let refreshToken: string | null = null;

const base64URLEncode = (str: Buffer) =>
    str
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

export const getToken: () => Promise<String> = async () => {
    if (!accessToken) {
        accessToken = await authenticate();
    }
    return accessToken;
};

// TODO: implement - not needed for now as endpoints accept requests without authentication
const authenticate = async () => {
    console.log('authenticating');
    const { url, challenge, verifier } = getAuthenticationURL();
    const auth = await axios.get(url, { maxRedirects: 0, validateStatus: (status) => (status === 302) });
    const login = new URL(auth.headers.location, url);
    console.log('redirect url is', login.toString());

    const query = login.searchParams;
    const code = query.get('code');
    console.log('code is',code);
    

    /* eslint-disable @typescript-eslint/naming-convention */
    const exchangeOptions = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: AUTH0_CALLBACK_URL,
        code_verifier: verifier,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const token = await axios.post(`https://${AUTH0_DOMAIN}/oauth/token`, exchangeOptions);
    console.log(token);
    return 'TODO';
};
const sha256 = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest();

const getAuthenticationURL = () => {
    const verifier = base64URLEncode(crypto.randomBytes(32));
    const challenge = base64URLEncode(sha256(Buffer.from(verifier)));

    const state = Math.random().toString(36).substring(2, 18);
    const scope = 'openid profile offline_access';
    const responseType = 'code';

    /* eslint-disable @typescript-eslint/naming-convention */
    const queryParams = {
        audience: API_AUDIENCE,
        client_id: CLIENT_ID,
        redirect_uri: AUTH0_CALLBACK_URL,
        state,
        scope,
        response_type: responseType,
        code_challenge: challenge,
        code_challenge_method: 'S256', // SHA-256
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    return {
        url: `https://${AUTH0_DOMAIN}/authorize?${new URLSearchParams(
            queryParams
        )}`,
        challenge,
        verifier,
    };
};