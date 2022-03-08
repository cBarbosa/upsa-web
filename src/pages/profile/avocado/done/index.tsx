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
    Text,
    Container,
    Heading,
    Button,
    Flex,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalHeader,
    ModalBody,
    Alert,
    AlertIcon,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    ModalFooter,
    useToast,
    AlertTitle,
    AlertDescription
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../../../services/firebase";
import {
    collection,
    getDocs,
    query,
    Timestamp,
    where
} from "firebase/firestore";
import { useRouter } from "next/router";
import DataTableRCkakra from '../../../../Components/Table';
import {
    EditIcon,
    RepeatIcon
} from "@chakra-ui/icons";
import InputMask from 'react-input-mask';
import { ProcessType } from '../../../../models/ThemisTypes';
import { UserType } from '../../../../models/FirebaseTypes';

const AvocadoDone: NextPage = () => {

    const {isAuthenticated, role, user} = useAuth();
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const route = useRouter();
    const [processList, setProcessList] = useState<ProcessType[]>([]);
    const [avocadoList, setAvocadoList] = useState<UserType[]>([]);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (user != null) {
            getProcessList().then(() => {
                if(upsaRole !='avocado') {
                    route.push('/');
                }
            });
        }
        getAvocadoList();
    }, []);

    const getProcessList = async () => {
        const processQuery = query(proccessCollection, where('active', '==', true), where('accountable', '==', user?.uid));
        const querySnapshot = await getDocs(processQuery);

        const result:ProcessType[] = [];
        querySnapshot.forEach((snapshot) => {
            const data = (snapshot.data() as ProcessType);
            // const hasNoInternalDateDivergency = data?.deadline?.every((val, i, arr) => val.deadline_internal_date === arr[0].deadline_internal_date);
            // const hasNoCourtDateDivergency = data?.deadline?.every((val, i, arr) => val.deadline_court_date === arr[0].deadline_court_date);
            const hasTwoDeadlines = data?.deadline?.length == 2;
            const isAlreadyResolved = !!data.date_final;

            if(hasTwoDeadlines && isAlreadyResolved) {
                result.push({
                    uid: snapshot.id,
                    number: snapshot.data().number,
                    author: snapshot.data().author,
                    defendant: snapshot.data().defendant,
                    decision: snapshot.data().decision,
                    accountable: snapshot.data().accountable,
                    deadline: snapshot.data().deadline,
                    themis_id: snapshot.data().themis_id,
                    date_final: snapshot.data().date_final,
                    created_at: snapshot.data().created_at,
                    updated_at: snapshot.data().updated_at,
                    active: snapshot.data().active
                });
            }
        });
        setProcessList(result);
    };

    const getAvocadoList = async () => {
        const processQuery = query(collection(database, 'users'));
        const querySnapshot = await getDocs(processQuery);

        const result:UserType[] = [];
        querySnapshot.forEach((snapshot) => {
            result.push({
                uid: snapshot.id,
                displayName: snapshot.data().displayName,
                email: snapshot.data().email,
                role: snapshot.data().role,
                photoURL: snapshot.data().photoURL,
                phoneNumber: snapshot.data().phoneNumber,
                themis_id: snapshot.data().themis_id,
                createdAt: snapshot.data().createdAt
            } as UserType);
        });
        setAvocadoList(result);
    };

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
            />);
    }

    function getProcessFromData() {
        const arrData: {
            number: string;
            author: string;
            defendant: string;
            created_at: string;
            edit: object;
        }[] = [];

        processList.map(proc => {
            arrData.push({
                number: proc.number,
                author: proc.author,
                defendant: proc.defendant,
                created_at: proc.created_at.toDate().toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                edit: editProcessFromData(proc)
            });
        });
        return arrData;
    }

    const _handleEditProcess = async (item: ProcessType) => {
        setEditProcess({...item, ['updated_at']: Timestamp.now() });
        onOpen();
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

    const dataTable = useMemo(
        () => getProcessFromData(), [process],
    );

    return (
        <>
            <Head>
                <title>UPSA - Distribuidos</title>
            </Head>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Flex justifyContent={'space-between'}>
                    <Heading color={'gray.600'}>
                        Processos Distribuidos
                    </Heading>
                    <Button
                            onClick={() => getProcessList()}
                            colorScheme={'blue'}
                        >
                            <RepeatIcon w={16}/>
                    </Button>
                </Flex>

                {processList.length > 0 ? (
                        <Box
                            py={30}
                        >
                            <DataTableRCkakra columns={columns} data={getProcessFromData()}/>
                        </Box>
                    ) : (
                    <Text
                        py={10}
                    >
                        Clique no botão atualizar
                    </Text>
                )}
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
                    <ModalHeader>Dados do processo (Visualização)</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>

                        <Flex>
                        <FormControl>
                            {editProcess?.themis_id && (
                                <Text>
                                    #{editProcess?.themis_id}
                                </Text>
                            )}
                            <FormLabel>Numero do processo</FormLabel>
                            <Input
                                as={InputMask}
                                variant={'filled'}
                                mask='9999999-99.9999.9.99.9999'
                                placeholder='Process number'
                                isRequired={true}
                                value={editProcess?.number}
                                readOnly={true}
                            />
                        </FormControl>
                        </Flex>
                        

                        <FormControl>
                            <FormLabel>Parte contrária</FormLabel>
                            <Input
                                placeholder='Author'
                                variant={'filled'}
                                value={editProcess?.author}
                                readOnly={true}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
                            <Input
                                placeholder='Réu'
                                variant={'filled'}
                                value={editProcess?.defendant}
                                readOnly={true}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Decisão do processo</FormLabel>
                            <Textarea
                                placeholder='Decision'
                                variant={'filled'}
                                value={editProcess?.decision}
                                rows={10}
                                readOnly={true}
                            />
                        </FormControl>

                        <Alert status='info' variant='left-accent' mt={3}>
                            <AlertIcon />
                            <Box flex='1'>
                                <AlertTitle>
                                    Data Judicial Final
                                </AlertTitle>
                                <AlertDescription display='block'>
                                    {editProcess?.date_final}
                                </AlertDescription>
                            </Box>
                        </Alert>

                        {/* {(editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_internal_date
                        && editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_court_date) && (
                            <Alert status='info' variant='left-accent'>
                                <AlertIcon />
                                <Text
                                    paddingRight={5}
                                >
                                    Data Interna: {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_internal_date}
                                </Text>
                                -
                                <Text
                                    paddingLeft={5}
                                >
                                    Data Judicial: {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_court_date}
                                </Text>
                            </Alert>
                        )} */}


                        {editProcess?.accountable && (
                            <Text
                                fontSize={'1rem'}
                                fontWeight={'bold'}
                            >
                                Advogado Responsável: {avocadoList.find(x => x.uid == editProcess?.accountable)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_internal_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[0]?.deadline_internal_date} por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_internal_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[1]?.deadline_internal_date} por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_court_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[0]?.deadline_court_date} por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_court_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[1]?.deadline_court_date} por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        <Text
                            fontSize={'0.rem'}
                            fontWeight={'bold'}
                        >
                            Criado em: {editProcess?.created_at?.toDate().toLocaleDateString('pt-BR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>

                        {editProcess?.updated_at && (
                            <Text
                                fontSize={'0.6rem'}
                                fontWeight={'bold'}
                            >
                                Atualizado em: {editProcess?.updated_at?.toDate().toLocaleDateString('pt-BR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        )}

                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            hidden={true}
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
                        <Button onClick={() => onClose()}>
                            Fechar
                        </Button>
                    </ModalFooter>
                </ModalContent>
          </Modal>
        </>
    );
}

export default AvocadoDone;

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
