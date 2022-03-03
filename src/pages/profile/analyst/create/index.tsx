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
    Button,
    Container,
    Flex,
    Text,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Textarea,
    useToast
} from "@chakra-ui/react";
import InputMask from 'react-input-mask';
import React, { useState } from 'react';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { api } from "../../../../services/api";
import {
    addDoc,
    collection,
    getDocs,
    query,
    Timestamp,
    where
} from "firebase/firestore";
import { db } from "../../../../services/firebase";

type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    themis_id?: number;
    deadline: DeadLineProcessType[];
    active: boolean;
    created_at: Timestamp;
    updated_at: Timestamp;
    date_final: Timestamp;
};

type DeadLineProcessType = {
    deadline_internal_date: string;
    deadline_court_date: string;
    deadline_interpreter: string;
    checked: boolean;
    created_at: Timestamp;
};

const AnalystCreate: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const toast = useToast();
    const {isAuthenticated, role, user} = useAuth();
    const [themisNumber, setThemisNumber] = useState<number | null>(null);
    const [processNumber, setProcessNumber] = useState('');
    const [processAuthor, setProcessAuthor] = useState('');
    const [processDefendant, setProcessDefendant] = useState('');
    const [processDecision, setProcessDecision] = useState('');
    const [internalDate, setInternalDate] = useState(new Date());
    const [courtDate, setCourtDate] = useState(new Date());

    const verifyDate = async (ref : Date, func: Function) => {
        if(ref < new Date()) {
            toast({
                title: 'Processo',
                description: "A data informada deve ser maior que hoje!",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            func(new Date());
        }
    };

    const cleanVariables = async () => {
        setProcessNumber('');
        setProcessAuthor('');
        setProcessDefendant('');
        setProcessDecision('');
        setInternalDate(new Date());
        setCourtDate(new Date());
        setThemisNumber(null);
    };

    const _handleCreateProcess = async () => {

        const snapProcess =  await getDocs(query(proccessCollection,
            where('number', '==', processNumber)));

        if(!snapProcess.empty) {
            toast({
                title: 'Processo',
                description: 'Processo já existe',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if(internalDate <= new Date()) {
            toast({
                title: 'Processo',
                description: "O Prazo Interno deve ser maior que a data atual",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if(courtDate <= internalDate) {
            toast({
                title: 'Processo',
                description: "O Prazo judicial deve ser maior que o Prazo Interno",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        const dataProcessNode1 = {
            deadline_internal_date: internalDate.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            deadline_court_date: courtDate.toLocaleDateString('pt-BR',{
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            deadline_interpreter: user?.uid,
            checked: false,
            created_at: Timestamp.now()
        };

        const dataProcess = {
            number: processNumber,
            author: processAuthor,
            defendant: processDefendant,
            decision: processDecision,
            active: true,
            themis_id: themisNumber,
            deadline: [dataProcessNode1],
            created_at: Timestamp.now()
        } as ProcessType;

        const docRef = await addDoc(proccessCollection, dataProcess);

        toast({
            title: 'Processo',
            description: "Processo cadastrado com sucesso",
            status: 'success',
            duration: 9000,
            isClosable: true,
        });
        cleanVariables();
    };

    const _handleGetProcessOnThemis = async (processNumber:string) => {
        api.get(`themis/process/${processNumber}`).then(result => {
            
            if(result.status === 204) {
                return;
            }
            setThemisNumber(result?.data?.id);
            toast({
                title: 'Processo',
                description: 'Processo atualizado com as informações do Themis',
                status: 'info',
                duration: 9000,
                isClosable: true,
            });
        }).catch(function (error) {
            console.log(error);
        });
    }

    return (
        <>
            <Head>
                <title>UPSA - Cadastro de Prazos</title>
            </Head>
            <NavBar/>

            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Heading color={'gray.600'}>
                    Cadastro de Prazos
                </Heading>

                <Box py={10}>

                    <Flex>
                    <FormControl>
                        <FormLabel>Numero do processo</FormLabel>
                        {themisNumber && (
                            <Text>
                                #{themisNumber}
                            </Text>
                        )}
                        <Input
                            as={InputMask}
                            variant={'filled'}
                            mask='9999999-99.9999.9.99.9999'
                            placeholder='Número do Processo'
                            onChange={event => setProcessNumber(event.target.value)}
                            onBlur={event => _handleGetProcessOnThemis(event.target.value)}
                            value={processNumber}
                        />
                    </FormControl>
                    </Flex>

                    <FormControl>
                        <FormLabel>Autor do processo</FormLabel>
                        <Input
                            placeholder='Autor'
                            variant={'filled'}
                            onChange={event => setProcessAuthor(event.target.value)}
                            value={processAuthor}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Réu do processo</FormLabel>
                        <Input
                            placeholder='Réu'
                            variant={'filled'}
                            onChange={event => setProcessDefendant(event.target.value)}
                            value={processDefendant}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Decisão do processo</FormLabel>
                        <Textarea
                            placeholder='Decisão'
                            variant={'filled'}
                            onChange={event => setProcessDecision(event.target.value)}
                            value={processDecision}
                        />
                    </FormControl>

                    <Flex>
                        <Box padding = {10}>
                        <FormControl>
                            <FormLabel>Prazo Interno</FormLabel>
                            <SingleDatepicker
                                date={internalDate}
                                onDateChange={(date:Date) => [setInternalDate(date), verifyDate(date, setInternalDate)]}
                            />
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                Data Formatada: {internalDate.toLocaleDateString('pt-BR',{
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                })}
                            </Text>
                            
                        </FormControl>
                        </Box>
                        
                        <Box padding = {10}>
                        <FormControl>
                            <FormLabel>Prazo Judicial</FormLabel>
                            <SingleDatepicker
                                date={courtDate}
                                onDateChange={(date:Date) => [setCourtDate(date), verifyDate(date, setCourtDate)]}
                            />
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                Data Formatada: {courtDate.toLocaleDateString('pt-BR',{
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                })}
                            </Text>
                        </FormControl>
                        </Box>
                        
                    </Flex>

                    <Box
                        background={'ButtonFace'}
                        rounded={5}
                        align={'center'}
                        p={5}
                    >
                        <Button
                            colorScheme='blue'
                            mr={5}
                            onClick={event => _handleCreateProcess()}
                        >
                            Salvar
                        </Button>
                        <Button
                            variant={'outline'}
                            colorScheme={'red'}
                            onClick={() => [cleanVariables()]}>
                            Cancelar
                        </Button>
                    </Box>
                    
                </Box>

            </Container>
            <BottomNav/>
        </>
    );
}

export default AnalystCreate;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    // const {['upsa.role']: upsaRole} = parseCookies(ctx);
    // const acceptedRules = ['analyst'];

    // if (!acceptedRules.includes(upsaRole)) {
    //     return {
    //         redirect: {
    //             destination: '/',
    //             permanent: false,
    //         },
    //     }
    // }

    return {
        props: {}
    };
}
