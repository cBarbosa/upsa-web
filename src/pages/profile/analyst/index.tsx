import Head from "next/head";
import { GetServerSideProps, NextPage } from "next/types";
import BottomNav from "../../../Components/BottomNav";
import NavBar from "../../../Components/NavBar";
import { useAuth } from "../../../Contexts/AuthContext";

const AnalystHome: NextPage = () => {
  
    const { isAuthenticated, role } = useAuth();

    return (
        <>
          <Head>
            <title>UPSA - Analista</title>
          </Head>
  
          <NavBar/>
  
          isAuthenticated: {isAuthenticated}<br />
          perfil: {role}

          <BottomNav />
        </>
    );
}
  
export default AnalystHome;

export const getServerSideProps: GetServerSideProps = async (ctx) => {

    return {
        props: {
          protected: true,
          userTypes: ['analyst']
        }
    };
}
