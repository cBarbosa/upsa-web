import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app"

// https://github.com/carlson-technologies/coffeeclass.io
// https://github.com/dingran/ghost-utils
// https://dev.to/dingran/next-js-firebase-authentication-and-middleware-for-api-routes-29m1
// https://blog.logrocket.com/implementing-authentication-in-next-js-with-firebase/
// https://dev.to/shareef/context-api-with-typescript-and-next-js-2m25 => https://github.com/shareef99/context-api-with-nextjs-and-ts

function MyApp({ Component, pageProps }: AppProps) {
  return(
     <ChakraProvider>
      <Component {...pageProps} />
     </ChakraProvider>
  ); 
}

export default MyApp
