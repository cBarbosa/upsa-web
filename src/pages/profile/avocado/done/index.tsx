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
import { api } from "../../../../services/api";

const AvocadoDone: NextPage = () => {

    const {isAuthenticated, role, user} = useAuth();
    const database = db;
    // const proccessCollection = collection(database, 'proccess');
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const route = useRouter();
    const [processList, setProcessList] = useState<ProcessType[]>([]);
    const [avocadoList, setAvocadoList] = useState<UserType[]>([]);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);
    const toast = useToast();
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        // const processQuery = query(proccessCollection, where('active', '==', true), where('accountable', '==', user?.uid));
        // const querySnapshot = await getDocs(processQuery);

        const processQuery = await api.get(`Process?size=90000`).then(processos => {
            
            const querySnapshot:ProcessType[] = (processos.data.items as ProcessType[]).filter(item => item.accountable == user?.uid);
            let result: ProcessType[] = [];

            querySnapshot.forEach(snapshot => {

                const hasTwoDeadlines = snapshot?.deadline?.length == 2;
                const isAlreadyResolved = !!snapshot.date_Final;

            if(hasTwoDeadlines
                && (hasTwoDeadlines && isAlreadyResolved)) {
                    result.push(snapshot);
                }
            });

            setProcessList(result);
        })
        .catch(function (error) {
            console.error(error);
        })
        .finally(() => setLoading(false));

    };

    const getAvocadoList = async () => {

        const processQuery = await api.get(`User?size=90000`)
        .then(usuarios => {

            setAvocadoList(usuarios.data.items ?? []);
        }).catch(function (error) {
            console.error(error);
        });
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
                created_at: new Date(proc.created_At).toLocaleDateString('pt-BR', {
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
        setEditProcess({...item, ['updated_At']: new Date() });
        onOpen();
    };

    const columns = useMemo(
        () => [
            {
                Header: 'Processo',
                accessor: 'number',
            },
            {
                Header: 'Parte Interessada',
                accessor: 'author',
            },
            {
                Header: 'Parte Contrária',
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

                {loading && (<div>Carregando ...</div>)}

                {!loading && processList.length > 0 ? (
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
                            {editProcess?.themis_Id && (
                                <Text>
                                    #{editProcess?.themis_Id}
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
                                    {(editProcess?.date_Final != null && editProcess?.date_Final != 'null') ? editProcess?.date_Final : 'Definido sem prazo'}
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

                        {editProcess?.deadline[0]?.deadline_Internal_Date != null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[0]?.deadline_Internal_Date} por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_Internal_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_Internal_Date != null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[1]?.deadline_Internal_Date} por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_Internal_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_Court_Date != null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[0]?.deadline_Court_Date} por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_Court_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {avocadoList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_Court_Date != null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[1]?.deadline_Court_Date} por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_Court_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {avocadoList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        <Text
                            fontSize={'0.rem'}
                            fontWeight={'bold'}
                        >
                            Criado em: {new Date(editProcess?.created_At ?? new Date())?.toLocaleDateString('pt-BR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>

                        {editProcess?.updated_At && (
                            <Text
                                fontSize={'0.6rem'}
                                fontWeight={'bold'}
                            >
                                Atualizado em: {new Date(editProcess?.updated_At ?? new Date())?.toLocaleDateString('pt-BR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        )}
                        <Text
                            fontSize={'0.6rem'}
                            fontWeight={'light'}
                        >
                            {editProcess?.uid}
                        </Text>

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
