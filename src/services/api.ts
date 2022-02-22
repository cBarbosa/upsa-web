import axios from 'axios';

function getAPIClient(ctx?: any) {

    const AURUM_AUTH = process.env.NEXT_PUBLIC_THEMIS_TOKEN ?? '';

    const api = axios.create({
        baseURL: 'https://upsa.themisweb.penso.com.br/upsa/api',
        headers: {'X-Aurum-Auth': AURUM_AUTH}
    });

    api.interceptors.request.use(config => {
        return config;
    });

    return api;
}

export const api = getAPIClient();
