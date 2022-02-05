import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useDisclosure
} from '@chakra-ui/react';
import {collection, getDocs, query, where} from 'firebase/firestore';
import type {GetServerSideProps, NextPage} from 'next';
import Head from 'next/head'
import React, {Fragment, useEffect, useState} from 'react';
import BottomNav from '../../Components/BottomNav';
import NavBar from '../../Components/NavBar';
import {useAuth} from '../../Contexts/AuthContext';
import {db} from '../../services/firebase';
import {parseCookies} from "nookies";

type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    deadline: [
        {
            deadline_days: number;
            deadline_date: Date;
            deadline_interpreter: string;
            checked: boolean;
        }];
    active: boolean;
    created_at: Date;
    updated_at: Date;
};

const ProcessListPage: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const {user, role, login} = useAuth();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [process, setProcess] = useState<ProcessType[]>([]);

    useEffect(() => {
        getProcess();
    }, []);

    const getProcess = async () => {
        const processQuery = query(proccessCollection, where('active', '==', true));
        const querySnapshot = await getDocs(processQuery);

        const result: ProcessType[] = [];
        querySnapshot.forEach((snapshot) => {
            result.push({
                uid: snapshot.id,
                number: snapshot.data().number,
                author: snapshot.data().author,
                defendant: snapshot.data().defendant,
                decision: snapshot.data().decision,
                accountable: snapshot.data().accountable,
                deadline: snapshot.data().deadline,
                created_at: snapshot.data().created_at,
                updated_at: snapshot.data().updated_at,
                active: snapshot.data().active
            } as ProcessType);
        });
        setProcess(result);
    };

    const _handleAddProcess = async () => {
        onOpen();
    };

    return (
        <Fragment>
            <Head>
                <title>UPSA - Processos</title>
            </Head>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>


                <Flex justifyContent={'space-between'}>
                    <Heading color={'gray.600'}>
                        Processos
                    </Heading>
                    <Button onClick={_handleAddProcess} colorScheme={'blue'}>
                        Adicionar
                    </Button>
                </Flex>
                <Flex>
                    {process.length > 0 ? process.map(process => {
                        return (
                            <Box
                                key={process.uid}
                            >
                                <Text>
                                    Processo: {process.number}
                                </Text>
                            </Box>
                        )
                    }) : (
                        <Text py={10}>
                            Nenhum processo cadastrado
                        </Text>
                    )
                    }
                </Flex>
            </Container>

            <BottomNav/>

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                closeOnOverlayClick={false}
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Dados do processo</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>

                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                        >
                            Salvar
                        </Button>
                        <Button
                            colorScheme='red'
                            mr={3}
                            hidden={true}
                        >
                            Deletar
                        </Button>
                        <Button
                        >
                            Cancelar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Fragment>
    )
}

export default ProcessListPage;


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const {['upsa.role']: upsaRole} = parseCookies(ctx);
    const acceptedRules = ['admin', 'analyst', 'avocado']
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
