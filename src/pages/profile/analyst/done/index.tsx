import Head from "next/head";
import {
    GetServerSideProps,
    NextPage
} from "next/types";
import BottomNav from "../../../../Components/BottomNav";
import NavBar from "../../../../Components/NavBar";
import {useAuth} from "../../../../Contexts/AuthContext";
import {parseCookies} from "nookies";
import {
    Box,
    Container,
    Heading
} from "@chakra-ui/react";
import React from "react";

const AnalystDone: NextPage = () => {

    const {isAuthenticated, role} = useAuth();

    return (
        <>
            <Head>
                <title>UPSA - Distribuídos</title>
            </Head>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Heading color={'gray.600'}>
                    Distribuídos
                </Heading>
                <Box py={10}>
                    isAuthenticated: {isAuthenticated}<br/>
                    perfil: {role}
                </Box>
            </Container>
            <BottomNav/>
        </>
    );
}

export default AnalystDone;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const {['upsa.role']: upsaRole} = parseCookies(ctx);
    const acceptedRules = ['analyst'];

    if (!acceptedRules.includes(upsaRole)) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {
        props: {}
    };
}
