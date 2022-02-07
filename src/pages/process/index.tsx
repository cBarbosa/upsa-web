import {
    Box,
    Button,
    Container,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    IconButton,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head'
import React, {Fragment, useEffect, useMemo, useState} from 'react';
import BottomNav from '../../Components/BottomNav';
import NavBar from '../../Components/NavBar';
import {useAuth} from '../../Contexts/AuthContext';
import {db} from '../../services/firebase';
import {parseCookies} from "nookies";
import InputMask from 'react-input-mask';
import DataTableRCkakra from "../../Components/Table";

type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    deadline: 
        {
            deadline_days: number;
            deadline_date: Date;
            deadline_interpreter: string;
            checked: boolean;
            created_at: Date;
        }[];
    active: boolean;
    created_at: Date;
    updated_at: Date;
};

const ProcessListPage: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const {user, role, login} = useAuth();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const toast = useToast();
    const [process, setProcess] = useState<ProcessType[]>([]);
    const [prazo, setPrazo] = useState<Date>(new Date());
    const [processNumber, setProcessNumber] = useState('');
    const [processAuthor, setProcessAuthor] = useState('');
    const [processDefendant, setProcessDefendant] = useState('');
    const [processDecision, setProcessDecision] = useState('');
    const [processDays, setProcessDays] = useState(0);
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);

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

    const _handleNewProcess = async () => {

        const snapProcess =  await getDocs(query(proccessCollection, where('number', '==', processNumber)));

        if(!snapProcess.empty) {
            toast({
                title: 'Processo',
                description: "Processo já existe",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        const dataProcess = {
            number: processNumber,
            author: processAuthor,
            defendant: processDefendant,
            decision: processDecision,
            active: true,
            created_at: new Date()
        } as ProcessType;

        const docRef = await addDoc(proccessCollection, dataProcess);

        const dataProcessNode1 = {
            deadline_days: processDays,
            deadline_date: prazo,
            deadline_interpreter: user?.uid,
            checked: false,
            created_at: new Date()
        };

        await updateDoc(docRef, {
            deadline: arrayUnion(dataProcessNode1)
        });

        toast({
            title: 'Processo',
            description: "Processo cadastrado com sucesso",
            status: 'success',
            duration: 9000,
            isClosable: true,
        });

        getProcess();
        onClose();
    };

    const _handleEditProcess = async (item: ProcessType) => {
        setEditProcess(item);
        onOpen();
    };
    
    const _handleUpdateProcess = async () => {

        try {
            const _process = doc(db, `users/${editProcess?.uid}`);

            await updateDoc(_process, editProcess);

            getProcess();

            toast({
                title: 'Processo',
                description: "Processo alterado com sucesso",
                status: 'success',
                duration: 9000,
                isClosable: true,
            });

            setEditProcess(null);

        } catch (error) {
            console.log(error);
        }

        onClose();
    };

    const columns = useMemo(
        () => [
            {
                Header: 'Processo',
                accessor: 'number',
            },
            {
                Header: 'Autor',
                accessor: 'author',
            },
            {
                Header: 'Réu',
                accessor: 'defendant',
            },
            {
                Header: 'Dt. Criação',
                accessor: 'created_at',
            },
            {
                Header: 'Editar',
                accessor: 'edit',
            }
        ],
        [],
    );

    function getProcessFromData() {
        const arrData: { number: string; author: string; defendant: string; created_at: string; edit: object; }[] = []
        process.map(proc => {
            arrData.push({
                number: proc.number,
                author: proc.author,
                defendant: proc.defendant,
                created_at: proc.created_at.toDate().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }),
                edit: editProcessFromData(proc)
            })
        })
        return arrData
    }

    function editProcessFromData(proc: ProcessType) {
        return (<IconButton
            ml={4}
            size='md'
            colorScheme='blue'
            variant='outline'
            aria-label='Editar processo'
            icon={<EditIcon/>}
            onClick={() => {
                _handleEditProcess(proc)
            }}
        />)
    }

    const dataTable = useMemo(
        () => getProcessFromData(), [process],
    );

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

                {process.length > 0 ? (
                        <Box
                            py={30}
                        >
                            <DataTableRCkakra columns={columns} data={getProcessFromData()}/>
                        </Box>
                    ) : (
                    <Text py={10}>
                        Nenhum processo cadastrado
                    </Text>
                )}
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

                        <FormControl>
                            <FormLabel>Numero do processo</FormLabel>
                            <Input
                                as={InputMask}
                                variant={'filled'}
                                mask='9999999-99.9999.9.99.9999'
                                placeholder='Process number'
                                isRequired={true}
                                onChange={event => setProcessNumber(event.target.value)}
                                value={editProcess?.number}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Autor do processo</FormLabel>
                            <Input
                                placeholder='Author'
                                variant={'filled'}
                                onChange={event => setProcessAuthor(event.target.value)}
                                value={editProcess?.author}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Réu do processo</FormLabel>
                            <Input
                                placeholder='Réu'
                                variant={'filled'}
                                onChange={event => setProcessDefendant(event.target.value)}
                                value={editProcess?.defendant}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Decisão do processo</FormLabel>
                            <Textarea
                                placeholder='Decision'
                                variant={'filled'}
                                onChange={event => setProcessDecision(event.target.value)}
                                value={editProcess?.decision}
                            />
                        </FormControl>

                        {editProcess?.deadline.find(x=>x.deadline_interpreter == user?.uid) && (
                            <FormControl>
                                <FormLabel>Dias de prazo</FormLabel>
                                <Input
                                    placeholder='Dias de prazo'
                                    variant={'filled'}
                                    type={'number'}
                                    maxLength={3}
                                    onChange={(event) => {setPrazo(event.target.value != ''
                                        ? new Date(new Date().setDate(new Date().getDate() + parseInt(event.target.value)))
                                        : new Date()); setProcessDays(parseInt(event.target.value)); }}
                                    value={ editProcess?.deadline.find(x=>x.deadline_interpreter == user?.uid)?.deadline_days }
                                />
                                {processDays > 0 && `Prazo calculado: ${prazo.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}`}
                            </FormControl>
                        )}

                        {editProcess == null && (
                            <FormControl>
                                <FormLabel>Dias de prazo</FormLabel>
                                <Input
                                    placeholder='Dias de prazo'
                                    variant={'filled'}
                                    type={'number'}
                                    maxLength={3}
                                    onChange={(event) => {setPrazo(event.target.value != ''
                                        ? new Date(new Date().setDate(new Date().getDate() + parseInt(event.target.value)))
                                        : new Date()); setProcessDays(parseInt(event.target.value)); }}
                                />
                                {processDays > 0 && `Prazo calculado: ${prazo.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}`}
                            </FormControl>
                        )}

                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            onClick={event => { editProcess == null ? _handleNewProcess() : _handleUpdateProcess() }}
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
                        <Button onClick={onClose}>
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
