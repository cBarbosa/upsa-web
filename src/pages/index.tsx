import {Box, Container, Heading, Text} from '@chakra-ui/react';
import type {GetServerSideProps, NextPage} from 'next';
import Head from 'next/head'
import {useRouter} from 'next/router';
import React, {Fragment} from 'react';
import BottonNav from '../Components/BottomNav';
import NavBar from '../Components/NavBar';
import {useAuth} from '../Contexts/AuthContext'

const Home: NextPage = () => {
    const router = useRouter();
    const {user, role} = useAuth();

    // useEffect(() => {
    //   if(!!user) {
    //     router.push('/login');
    //   }
    // }, [user]);

    return (
        <Fragment>
            <Head>
                <title>UPSA</title>
            </Head>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                {(user) && <Heading color={'gray.600'}>
                    Home
                </Heading>}

                <Box py={10}>
                    {(!user || role == 'none' || role == '') ? (
                        <Text>
                            Você não está logado ou está aguardando autorização para navegar
                        </Text>
                    ) : (
                        <Text>
                            Você está autenticado
                        </Text>
                    )}
                </Box>
            </Container>
            <BottonNav/>
        </Fragment>
    )
}

export default Home;

export const getServerSideProps: GetServerSideProps = async (ctx) => {

    return {
        props: {}
    };
}
