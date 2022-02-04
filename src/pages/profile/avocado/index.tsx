import Head from "next/head";
import { GetServerSideProps, NextPage } from "next/types";
import { useAuth } from "../../../Contexts/AuthContext";

const AvocadoHome: NextPage = () => {
  
    const { isAuthenticated } = useAuth();

    return (
        <>
          <Head>
            <title>UPSA - Advogados</title>
          </Head>
  
          isAuthenticated: {isAuthenticated}

          <footer>
              Powered by CB
          </footer>
        </>
    );
}
  
export default AvocadoHome;

export const getServerSideProps: GetServerSideProps = async (ctx) => {

    return {
        props: {
          protected: true,
          userTypes: ['avocado']
        }
    };
}
