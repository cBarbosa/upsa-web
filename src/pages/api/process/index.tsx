import nc from 'next-connect';
import cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

const _config = {
    headers: {
        'X-Aurum-Auth': 'cHJhem9zOjc5N2VhNzU5MGM5NGMwNzk1YTI5YThmNDI5OTMzNGQ1'
    }
}

const handler = nc()
  // use connect based middleware
  .use(cors())
  .get(async (req: NextApiRequest, res: NextApiResponse) => {
    const response = await fetch('https://upsa.themisweb.penso.com.br/upsa/api/processos/numero/0000000-00.2022.8.07.0000/json', _config);
    res.json(response);
  });

export default handler;
