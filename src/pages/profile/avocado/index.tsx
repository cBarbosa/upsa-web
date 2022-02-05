import Head from "next/head";
import { GetServerSideProps, NextPage } from "next/types";
import BottomNav from "../../../Components/BottomNav";
import NavBar from "../../../Components/NavBar";
import { useAuth } from "../../../Contexts/AuthContext";

const AvocadoHome: NextPage = () => {
  
    const { isAuthenticated, role } = useAuth();

    return (
        <>
          <Head>
            <title>UPSA - Advogado</title>
          </Head>

          <NavBar/>
  
          isAuthenticated: {isAuthenticated}<br />
          perfil: {role}

          <BottomNav />
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
