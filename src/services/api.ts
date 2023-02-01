import axios from 'axios';

function getAPIClient() {

    const api = axios.create({
        baseURL: 'https://upsa-api.azurewebsites.net/api',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS'
        }
    });
   
    return api;
}

export const api = getAPIClient();
