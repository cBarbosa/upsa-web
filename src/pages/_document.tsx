import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import { GA_TRACKING_ID } from '../scripts/gtag';
import { GoogleFonts } from 'next-google-fonts';

declare global {
    interface Window {
        splitbee: any;
    }
}

export default class MyDocument extends Document {

    static async getInitialProps(ctx: DocumentContext) {

      const initialProps = await Document.getInitialProps(ctx);
  
      return initialProps;
    }
    
    render() {

        // Add splitbee event tracking
        function handleState() {
            window.splitbee.track("Button Click");
        }
    
        if (typeof window !== "undefined") {
            window.addEventListener("load", handleState);
        }

        return(
            <Html>
                <GoogleFonts href="https://fonts.googleapis.com/css?family=Inter&display=swap" />
                <Head>
                    {process.env.NODE_ENV === "production" && (
                        <>
                            {/* Global Site Tag (gtag.js) - Google Analytics */}
                            <script
                                async
                                src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
                            />
                            <script
                                dangerouslySetInnerHTML={{
                                __html: `
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                        gtag('config', '${GA_TRACKING_ID}', {
                                        page_path: window.location.pathname,
                                        });
                                    `,
                                }}
                            />
                        </>
                    )}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
