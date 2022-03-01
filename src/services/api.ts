import axios from 'axios';

function getAPIClient() {

    const AURUM_AUTH = process.env.NEXT_PUBLIC_THEMIS_TOKEN ?? '';

    const api = axios.create({
        baseURL: 'https://upsa.themisweb.penso.com.br/upsa/api',
        headers: {
            // 'Access-Control-Allow-Origin': '*',
            // // 'Access-Control-Allow-Headers': 'Content-Type',
            // 'Content-Type': 'application/json;charset=utf-8',
            // 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
            // 'Access-Control-Allow-Headers': 'append,delete,entries,foreach,get,has,keys,set,values,Authorization',
            // 'Host': 'upsa.themisweb.penso.com.br',
            'X-Aurum-Auth': AURUM_AUTH
        }
    });

    // api.interceptors.request.use(config => {
    //     return config;
    // });

    // api.defaults.headers.common['X-Aurum-Auth'] = AURUM_AUTH;
    // api.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8';
   
    return api;
}

export const api = getAPIClient();
