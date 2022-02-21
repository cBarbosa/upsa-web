import { db } from "../../../services/firebase";
import DataTableRCkakra from "../../../Components/Table";
import Head from "next/head";
import {
    GetServerSideProps,
    NextPage
} from "next/types";
import BottomNav from "../../../Components/BottomNav";
import NavBar from "../../../Components/NavBar";
import { useAuth } from "../../../Contexts/AuthContext";
import {parseCookies} from "nookies";
import {
    Box,
    Container,
    Heading,
    IconButton,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    ModalFooter,
    Button,
    useDisclosure,
    Flex,
    toast,
    useToast,
    Select,
    Alert,
    AlertIcon
} from "@chakra-ui/react";
import React, {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import InputMask from 'react-input-mask';
import { EditIcon, RepeatIcon } from "@chakra-ui/icons";

type ProcessType = {
    uid: string;
    number: string;
    author: string;
    defendant: string;
    decision: string;
    accountable: string;
    deadline: DeadLineProcessType[];
    active: boolean;
    created_at: Timestamp;
    updated_at: Timestamp;
    date_final: Timestamp;
};

type DeadLineProcessType = {
    deadline_days: number;
    deadline_date: Timestamp;
    deadline_interpreter: string;
    checked: boolean;
    created_at: Timestamp;
};

type UserType = {
    uid: string;
    displayName: string;
    email: string;
    role: string;
    photoURL?: string;
    phoneNumber?: string;
    createdAt: string;
};

const AnalystHome: NextPage = () => {
    const toast = useToast();
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const { isAuthenticated, role, user } = useAuth();
    const [processList, setProcessList] = useState<ProcessType[]>([]);
    const [avocadoList, setAvocadoList] = useState<UserType[]>([]);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);
    const [deadLineProcess, setDeadLineProcess] = useState<DeadLineProcessType | null>(null);
    const [prazo, setPrazo] = useState<Date>(new Date());
    const [processDays, setProcessDays] = useState(0);

    useEffect(() => {
        getProcessList();
        getAvocadoList();
    }, []);

    const getProcessList = async () => {
        const processQuery = query(proccessCollection, where('active', '==', true));
        const querySnapshot = await getDocs(processQuery);

        const result:ProcessType[] = [];
        querySnapshot.forEach((snapshot) => {

            const hasAccountability = (snapshot.data() as ProcessType)?.deadline?.some(x => x.deadline_interpreter == user?.uid);

            if(hasAccountability)
            {
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
                    date_final: snapshot.data().date_final,
                    active: snapshot.data().active
                });
            }
        });
        setProcessList(result);
    };

    const getAvocadoList = async () => {
        const processQuery = query(collection(database, 'users'), where('role', '==', 'avocado'));
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
                createdAt: snapshot.data().createdAt
            } as UserType);
        });
        setAvocadoList(result);
    };

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

    const _handleEditProcess = async (item: ProcessType) => {
        setEditProcess({...item, ['updated_at']: Timestamp.now() });
        if(role ==='analyst') {
            setDeadLineProcess(item.deadline?.find(x=>x.deadline_interpreter == user?.uid) ?? null);
            setPrazo(item.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_date.toDate() ?? new Date())
            setProcessDays(item.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_days ?? 0);
        }
        onOpen();
    };

    const _handleUpdateProcess = async () => {

        if(role ==='analyst' && (processDays < 1 || prazo < new Date())) {
            toast({
                title: 'Processo',
                description: 'Prazo deve contemplar uma data maior que a atual',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        try {
            const _processRef = doc(db, `proccess/${editProcess?.uid}`);

            const result = await updateDoc(_processRef, {
                author: editProcess?.author,
                defendant: editProcess?.defendant,
                decision: editProcess?.decision,
                updated_at: editProcess?.updated_at,
                accountable: editProcess?.accountable ?? null
            });

            if(role === 'analyst' && processDays > 0) {
                const dataProcessNode1 = {
                    deadline_days: processDays,
                    deadline_date: prazo,
                    deadline_interpreter: user?.uid,
                    checked: false,
                    created_at: Timestamp.now()
                };

                if(editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid))
                {
                    await updateDoc(_processRef, {
                        deadline: arrayRemove(editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid))
                    });
                }
        
                await updateDoc(_processRef, {
                    deadline: arrayUnion(dataProcessNode1)
                });
            }

            await getProcessList();

            toast({
                title: 'Processo',
                description: "Processo alterado com sucesso",
                status: 'success',
                duration: 9000,
                isClosable: true,
            });

        } catch (error) {
            console.log(error);

            toast({
                title: 'Processo',
                description: 'Erro atualizando o processo',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        }

        cleanVariables();
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

    const dataTable = useMemo(
        () => getProcessFromData(), [process],
    );

    function cleanVariables() {
        setEditProcess(null);
        setProcessDays(0);
        setPrazo(new Date());
        setDeadLineProcess(null);
    }

    return (
        <>
          <Head>
            <title>UPSA - Analista</title>
          </Head>
  
          <NavBar/>

            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Flex justifyContent={'space-between'}>
                    <Heading color={'gray.600'}>
                        Meus processos
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
                        Nenhum processo encontrado
                    </Text>
                )}
            </Container>

          <BottomNav />

          

          <Modal
                isOpen={isOpen}
                onClose={onClose}
                closeOnOverlayClick={false}
                size={'full'}
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Dados do processo (Atualização)</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>

                        {(editProcess?.deadline !=null
                            && editProcess?.deadline.length == 2
                            && !editProcess?.deadline?.every((val, i, arr) => val.deadline_days === arr[0].deadline_days)
                            ) && (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES
                            </Alert>
                        )}

                        <FormControl>
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

                        <FormControl>
                            <FormLabel>Autor do processo</FormLabel>
                            <Input
                                placeholder='Author'
                                variant={'filled'}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['author']:event.target.value} : null)}
                                value={editProcess?.author}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Réu do processo</FormLabel>
                            <Input
                                placeholder='Réu'
                                variant={'filled'}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['defendant']:event.target.value} : null)}
                                value={editProcess?.defendant}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Decisão do processo</FormLabel>
                            <Textarea
                                placeholder='Decision'
                                variant={'filled'}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['decision']:event.target.value} : null)}
                                value={editProcess?.decision}
                                rows={10}
                            />
                        </FormControl>

                        {(role == 'analyst' || role =='admin')
                            &&(!editProcess?.accountable) &&(

                        <FormControl mt={4}>
                            <FormLabel>Responsável</FormLabel>
                            <Select
                                placeholder='Escolha o responsável'
                                variant={'filled'}
                                value={editProcess?.accountable}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['accountable']:event.target.value} : null)}
                            >
                                {avocadoList.map((adv) => {
                                    return(
                                        <option
                                            key={adv.uid}
                                            selected={adv.uid == editProcess?.accountable}
                                        >
                                            {adv.displayName}
                                        </option>
                                    )
                                })}
                            </Select>
                        </FormControl>
                        )}

                        {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid) && !editProcess?.date_final && (
                            <FormControl>
                                <FormLabel>Dias de prazo</FormLabel>
                                <Input
                                    placeholder='Dias de prazo'
                                    variant={'filled'}
                                    type={'number'}
                                    maxLength={3}
                                    onChange={(event) => {setPrazo(event.target.value != ''
                                        ? new Date(new Date().setDate(editProcess?.created_at.toDate().getDate() + parseInt(event.target.value)))
                                        : new Date()); setProcessDays(parseInt(event.target.value)); }}
                                    value={processDays}
                                />
                                {
                                    (<Text
                                        color={'green.900'}
                                    >
                                        Prazo calculado: {prazo?.toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                )}
                            </FormControl>
                        )}

                        {role==='admin' && (
                            editProcess?.deadline?.map((process, index) => {
                                return(
                                    <Flex
                                        key={index}
                                        alignContent={'center'}
                                    >
                                        <Text
                                            
                                        >
                                            {process.deadline_days}
                                        </Text>
                                        <Text>
                                            {process.deadline_date.toDate().toLocaleDateString('pt-BR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </Flex>
                                );
                            })
                        )}

                        {role === 'analyst'
                            && (!editProcess?.deadline
                            || editProcess?.deadline?.filter(x => x.deadline_interpreter == user?.uid).length == 0)
                            && (
                                <FormControl>
                                    <FormLabel>Dias de prazo</FormLabel>
                                    <Input
                                        placeholder='Dias de prazo'
                                        variant={'filled'}
                                        type={'number'}
                                        maxLength={3}
                                        onChange={(event) => {setPrazo(event.target.value != ''
                                            ? new Date(new Date().setDate((editProcess?.created_at.toDate() ?? new Date()).getDate() + parseInt(event.target.value)))
                                            : new Date()); setProcessDays(parseInt(event.target.value)); }}
                                        value={processDays}
                                    />
                                    {processDays > 0 && (
                                        <Text
                                            color={'green.900'}
                                        >
                                            Prazo calculado: {prazo.toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </Text>)}
                                </FormControl>
                        )}

                        {editProcess?.accountable && (
                            <Text
                                fontSize={'1rem'}
                                fontWeight={'bold'}
                            >
                                Advogado Responsável: {avocadoList.find(x => x.uid == editProcess?.accountable)?.displayName}
                            </Text>
                        )}

                        {editProcess?.date_final && (
                            <Text
                                fontSize={'0.8rem'}
                                fontWeight={'bold'}
                                color={'blue.300'}
                            >
                                Data Final: {editProcess?.date_final?.toDate().toLocaleDateString('pt-BR', {
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
                            onClick={() => _handleUpdateProcess()}
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
                        <Button onClick={() => [onClose(), cleanVariables()]}>
                            Fechar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
  
export default AnalystHome;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const {['upsa.role']: upsaRole} = parseCookies(ctx);
    const acceptedRules = ['admin', 'analyst'];

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
