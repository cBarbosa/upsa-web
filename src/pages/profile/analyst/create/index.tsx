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
    useToast,
    Divider,
    Modal,
    ModalOverlay,
    ModalCloseButton,
    ModalBody,
    ModalHeader,
    ModalContent,
    useDisclosure,
    ModalFooter,
    Switch
} from "@chakra-ui/react";
import InputMask from 'react-input-mask';
import React, { useEffect, useState } from 'react';
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
import { ProcessType } from '../../../../models/ThemisTypes';
import { useRouter } from "next/router";
import { Search2Icon, SearchIcon } from "@chakra-ui/icons";

const AnalystCreate: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const toast = useToast();
    const {isAuthenticated, role, user} = useAuth();
    const [themisNumber, setThemisNumber] = useState<number | null>(null);
    const [processNumber, setProcessNumber] = useState('');
    const [processSummary, setProcessSummary] = useState('');
    const [processTitle, setProcessTitle] = useState('');
    const [processAuthor, setProcessAuthor] = useState('');
    const [processDefendant, setProcessDefendant] = useState('');
    const [processDecision, setProcessDecision] = useState('');
    const [internalDate, setInternalDate] = useState(new Date());
    const [courtDate, setCourtDate] = useState(new Date());
    const [instance, setInstance] = useState('');
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const route = useRouter();
    const [formVisible, setFormVisible] = useState(false);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [isCourtDeadline, setIsCourtDeadline] = useState(false);

    useEffect(() => {
        if (user != null) {
            if(upsaRole !='analyst') {
                route.push('/');
            }
        }
    }, []);

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

        setProcessTitle('');
        setProcessSummary('');
        setProcessAuthor('');
        setProcessDefendant('');
        setInstance('');

        setFormVisible(false);
        setIsCourtDeadline(false);
    };

    const _handleCreateProcess = async () => {

        // const snapProcess =  await getDocs(query(proccessCollection,
        //     where('number', '==', processNumber)));

        // if(!snapProcess.empty) {
        //     toast({
        //         title: 'Processo',
        //         description: 'Processo j?? existe',
        //         status: 'error',
        //         duration: 9000,
        //         isClosable: true,
        //     });
        //     return;
        // }

        if(isCourtDeadline && (internalDate <= new Date())) {
            toast({
                title: 'Processo',
                description: "O Prazo Interno deve ser maior que a data atual",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if(isCourtDeadline && (courtDate <= internalDate)) {
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
            deadline_internal_date: isCourtDeadline ? internalDate.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) : null,
            deadline_court_date: isCourtDeadline ? courtDate.toLocaleDateString('pt-BR',{
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) : null,
            deadline_interpreter: user?.uid,
            checked: false,
            created_at: Timestamp.now()
        };

        const dataProcess = {
            number: processNumber,
            author: processAuthor ?? 'N/D',
            defendant: processDefendant ?? 'N/D',
            decision: processDecision,
            instance: instance,
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
                toast({
                    title: 'Processo (Themis)',
                    description: 'Processo n??o localizado no Themis',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
                return;
            }
            
            const parteContrariaText = `${result?.data?.parteContraria?.nome} (${result?.data?.posicaoParte?.posPassiva === 'Autor' ? 'Autor' : 'R??u'})`;
            const parteInteressadaText = `${result?.data?.parteInteressada?.nome} (${result?.data?.posicaoParte?.posAtiva === 'Autor' ? 'Autor' : 'R??u'})`;

            setThemisNumber(result?.data?.id);
            setProcessTitle(`${result?.data?.titulo} (${result?.data?.instancia?.nome})`);
            setProcessSummary(result?.data?.resumo);
            setProcessAuthor(parteContrariaText);
            setProcessDefendant(parteInteressadaText);
            setInstance(result?.data?.instancia?.nome);
            onOpen();
        }).catch(function (error) {
            console.log(error);
        });
    }

    const _handleAddDeadLine = async () => {
        const snapProcess =  await getDocs(query(proccessCollection,
            where('number', '==', processNumber)));

        if(snapProcess.empty) {
            setFormVisible(true);
            return;
        }

        let hasPendingDistribuition = false;
        snapProcess.forEach((snapshot) => {
            const data = (snapshot.data() as ProcessType);

            const hasNoDateFinal = !data.date_final;
            const hasNoAccountable = !data.accountable;

            if(hasNoDateFinal && hasNoAccountable)
                hasPendingDistribuition = true;
        });

        if(hasPendingDistribuition) {
            toast({
                title: 'Processo',
                description: 'J?? existe uma distribui????o pendente para este processo',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        setFormVisible(true);
    };

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
                                <Input
                                    as={InputMask}
                                    variant={'filled'}
                                    mask='9999999-99.9999.9.99.9999'
                                    placeholder='N??mero do Processo'
                                    onChange={event => setProcessNumber(event.target.value)}
                                    onBlur={event => _handleGetProcessOnThemis(event.target.value)}
                                    value={processNumber}
                                    maxWidth={'500px'}
                                />
                        </FormControl>

                        <Divider w={5}/>

                        <FormControl hidden={!formVisible}>
                            <FormLabel>T??tulo do processo</FormLabel>
                            <Input
                                placeholder='T??tulo do processo'
                                variant={'filled'}
                                value={processTitle}
                                readOnly={true}
                            />
                        </FormControl>
                    </Flex>

                    <Flex hidden={!formVisible}>
                        <FormControl>
                            <FormLabel>Parte contr??ria</FormLabel>
                            <Input
                                placeholder='Autor'
                                variant={'filled'}
                                onChange={event => setProcessAuthor(event.target.value)}
                                value={processAuthor}
                                readOnly={true}
                            />
                        </FormControl>

                        <Divider w={5}/>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
                            <Input
                                placeholder='R??u'
                                variant={'filled'}
                                onChange={event => setProcessDefendant(event.target.value)}
                                value={processDefendant}
                                readOnly={true}
                            />
                        </FormControl>
                    </Flex>

                    <FormControl hidden={!formVisible} >
                        <FormLabel>Decis??o do processo</FormLabel>
                        <Textarea
                            placeholder='Decis??o'
                            variant={'filled'}
                            onChange={event => setProcessDecision(event.target.value)}
                            value={processDecision}
                        />
                    </FormControl>

                    <Flex
                        justify="center"
                        align="center"
                        hidden={!formVisible}
                        padding={5}
                    >
                        <FormLabel htmlFor="email-alerts">
                            Este processo tem prazo judicial?
                        </FormLabel>
                        <Switch
                            id="email-alerts"
                            defaultIsChecked={isCourtDeadline}
                            onChange={event => setIsCourtDeadline(event.target.checked)}
                        />
                    </Flex>

                    <Flex
                        hidden={!isCourtDeadline}
                        justify={'center'}
                        align={'center'}
                    >

                        <Box
                            padding={10}
                        >
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
                        hidden={!formVisible}
                    >
                        <Button
                            colorScheme='blue'
                            mr={5}
                            onClick={_handleCreateProcess}
                        >
                            Cadastrar Prazo
                        </Button>
                        <Button
                            variant={'outline'}
                            colorScheme={'red'}
                            onClick={cleanVariables}>
                            Cancelar
                        </Button>
                    </Box>
                    
                </Box>

            </Container>
            <BottomNav/>

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                closeOnOverlayClick={false}
                size={'xl'}
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Dados do Processo #{processNumber}</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>

                        <FormControl>
                            <FormLabel>T??tulo</FormLabel>
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                {processTitle}
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Resumo</FormLabel>
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                {processSummary}
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte contr??ria</FormLabel>
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                {processAuthor}
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
                            <Text
                                fontSize={'0.8rem'}
                                color={'GrayText'}
                            >
                                {processDefendant}
                            </Text>
                        </FormControl>

                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            onClick={() => [onClose(), _handleAddDeadLine()]}
                        >
                            Cadastrar Prazo
                        </Button>
                        <Button
                            colorScheme='red'
                            mr={3}
                            hidden={true}
                        >
                            Deletar
                        </Button>
                        <Button onClick={() => [onClose(), cleanVariables()]}>
                            Fechar
                        </Button>
                    </ModalFooter>

                </ModalContent>
            </Modal>
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
