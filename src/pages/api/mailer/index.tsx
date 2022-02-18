import { NextApiRequest, NextApiResponse } from "next/types";
let nodemailer = require('nodemailer');

export default async (req: NextApiRequest, res: NextApiResponse) => {

    const transporter = nodemailer.createTransport({
        pool: true,
        port: 587,
        secure: true,
        host: 'smtp.enterprisetecnologia.com.br',
        auth: {
          user: 'pedido@enterprisetecnologia.com.br',
          pass: ',|SUn^TKw3',
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
          },
    });

    if(req.method ==='GET') {
        // console.debug('req.body', req.body);

        const mailData = {
            from: 'pedido@enterprisetecnologia.com.br',
            to: 'xbrown@gmail.com',
            subject: `Message From ${req.body.subject}`,
            text: req.body.message,
            html: <div>{req.body.message}</div>
        };

        // verify connection configuration
        transporter.verify(function (error:any, success:any) {
            if (error) {
                console.log(error);
            } else {
                console.log("Server is ready to take our messages");
            }
        });
        res.status(200);

        // try {
        //     transporter.sendMail(mailData, function (err:any, info:any) {
        //         if(err)
        //           console.log(err)
        //         else
        //           console.log(info)
        //     });
        
        //     res.status(200);
        // } catch (error) {
        //     res.status(400);
        // }
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).end('Method not allowed');
    }
}
