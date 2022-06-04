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
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head'
import React, {
    Fragment,
    useEffect,
    useMemo,
    useState
} from 'react';
import BottomNav from '../../Components/BottomNav';
import NavBar from '../../Components/NavBar';
import {useAuth} from '../../Contexts/AuthContext';
import {db} from '../../services/firebase';
import {parseCookies} from "nookies";
import InputMask from 'react-input-mask';
import DataTableRCkakra from "../../Components/Table";
import { api } from '../../services/api';
import { ProcessType } from '../../models/ThemisTypes';
import { UserType } from '../../models/FirebaseTypes';
import { useRouter } from 'next/router';

const ProcessListPage: NextPage = () => {
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const {user, role, login} = useAuth();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {isOpen: isOpenEdit, onOpen: onOpenEdit, onClose: onCloseEdit} = useDisclosure();
    const toast = useToast();
    const [process, setProcess] = useState<ProcessType[]>([]);
    const [analystList, setAnalystList] = useState<UserType[]>([]);
    const [prazo, setPrazo] = useState<Date>(new Date());
    const [processNumber, setProcessNumber] = useState('');
    const [processAuthor, setProcessAuthor] = useState('');
    const [instance, setInstance] = useState('');
    const [processDefendant, setProcessDefendant] = useState('');
    const [processDecision, setProcessDecision] = useState('');
    const [processDays, setProcessDays] = useState(0);
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);
    const [prazoDefinitivo, setPrazoDefinitivo] = useState<Date>(new Date());
    const [processDaysFinal, setProcessDaysFinal] = useState(0);
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const route = useRouter();

    useEffect(() => {
        getProcess().then(()=>{
            if (user != null) {
                if(upsaRole !='admin') {
                    route.push('/');
                }
            }
        });
        getAnalystList();
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
                instance: snapshot.data().instance,
                accountable: snapshot.data().accountable,
                deadline: snapshot.data().deadline,
                created_at: snapshot.data().created_at,
                updated_at: snapshot.data().updated_at,
                active: snapshot.data().active,
                date_final: snapshot.data().date_final
            } as ProcessType);
        });
        setProcess(result);
    };

    const getAnalystList = async () => {
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
                createdAt: snapshot.data().createdAt
            } as UserType);
        });
        setAnalystList(result);
    };

    const _handleAddProcess = async () => {
        onOpen();
    };

    const _handleNewProcess = async () => {

        const snapProcess =  await getDocs(query(proccessCollection,
                                where('number', '==', processNumber)));

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
            created_at: Timestamp.now()
        } as ProcessType;

        const docRef = await addDoc(proccessCollection, dataProcess);

        if(role === 'analyst') {

            if(processDays < 1) {
                toast({
                    title: 'Processo',
                    description: "É necessário informar o prazo",
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
                return;
            }

            const dataProcessNode1 = {
                deadline_days: processDays,
                deadline_date: prazo,
                deadline_interpreter: user?.uid,
                checked: false,
                created_at: Timestamp.now()
            };
    
            await updateDoc(docRef, {
                deadline: arrayUnion(dataProcessNode1)
            });
            cleanVariables();
        }

        toast({
            title: 'Processo',
            description: "Processo cadastrado com sucesso",
            status: 'success',
            duration: 9000,
            isClosable: true,
        });

        await getProcess();
        cleanVariables();
        onClose();
    };

    const _handleEditProcess = async (item: ProcessType) => {

        api.get(`themis/process/${item.number}`).then(data => {
            console.debug('themis-data', data.data);
        }).catch(function (error) {
            // handle error
            console.log(error);
        });

        setEditProcess({...item, ['updated_at']: Timestamp.now() });
        onOpenEdit();
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
                //accountable: processDaysFinal > 0 ? user?.uid : null,
                //date_final: prazoDefinitivo ?? null
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

            if(role ==='avocado' && processDaysFinal > 0) {
                const deadlines = editProcess?.deadline;

                deadlines?.forEach(async element => {
                    await updateDoc(_processRef, {
                        deadline: arrayRemove(element)
                    });

                    await updateDoc(_processRef, {
                        deadline: arrayUnion({...element,
                            ['deadline_days']:processDaysFinal,
                            ['deadline_date']:prazoDefinitivo,
                            ['checked']:true})
                    });
                });
            }

            await getProcess();

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
        onCloseEdit();
    };

    const _handleDeleteProcess = async () => {
        try {
            const _processRef = doc(db, `proccess/${editProcess?.uid}`);
            await deleteDoc(_processRef);

            toast({
                title: 'Processo',
                description: "Processo deletado com sucesso",
                status: 'success',
                duration: 9000,
                isClosable: true,
            });

            await getProcess();
        } catch (error) {
            console.log(error);
        }

        cleanVariables();
        onCloseEdit();
    }

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

    const getProcessFromData =() => {
        const arrData: {
            number: string;
            author: string;
            defendant: string;
            created_at: string;
            edit: object;
        }[] = [];

        process.map(proc => {
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

    const editProcessFromData = (proc: ProcessType) => {
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

    const cleanVariables = () => {
        setEditProcess(null);
        setProcessDays(0);
        setPrazo(new Date());
        setPrazoDefinitivo(new Date());
        setProcessDaysFinal(0);

        setProcessNumber('');
        setProcessAuthor('');
        setProcessDefendant('');
        setProcessDecision('');
        setInstance('');
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
                    <ModalHeader>Dados do processo (Novo)</ModalHeader>
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
                                value={processNumber}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte contrária</FormLabel>
                            <Input
                                placeholder='Author'
                                variant={'filled'}
                                onChange={event => setProcessAuthor(event.target.value)}
                                value={processAuthor}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
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
                                placeholder='Decision'
                                variant={'filled'}
                                onChange={event => setProcessDecision(event.target.value)}
                                value={processDecision}
                            />
                        </FormControl>

                        {role==='analyst' && (
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
                                    value={processDays}
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
                            onClick={event => _handleNewProcess()}
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

            <Modal
                isOpen={isOpenEdit}
                onClose={onCloseEdit}
                closeOnOverlayClick={false}
                size={'full'}
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Dados do processo (Atualização)</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>
                        {/* Exibe a mensagem de inconsistência */}
                        {(editProcess?.deadline !=null
                            && editProcess?.deadline.length == 2
                            // && !editProcess?.deadline?.every((val, i, arr) => val.deadline_days === arr[0].deadline_days)
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
                            <FormLabel>Parte contrária</FormLabel>
                            <Input
                                placeholder='Author'
                                variant={'filled'}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['author']:event.target.value} : null)}
                                value={editProcess?.author}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
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

                        {/* Permite a edição do analista */}
                        {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid) && (!editProcess?.date_final) && (
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

                        {/* Lista as interpretações dos analistas */}
                        {/* {(role==='admin' || role =='avocado') && (
                            editProcess?.deadline?.map((process, index) => {
                                return(
                                    <Alert
                                        status='info'
                                        variant='left-accent'
                                        pt={2} key={index}
                                    >
                                        <AlertIcon />
                                        {process.deadline_days} dias,
                                        datado para {process.deadline_date.toDate().toLocaleDateString('pt-BR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })}
                                        , definido por &nbsp;
                                        <Text
                                            fontWeight={'bold'}
                                        >
                                            {analystList.find(x => x.uid == process.deadline_interpreter)?.displayName}
                                        </Text>
                                    </Alert>
                                );
                            })
                        )} */}

                        {/* Permite ao analista inserir uma data de interpreteção */}
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

                        {/* Permite ao advogado definir a data divergente que será respeitada */}
                        {/* {role === 'avocado'
                            && (editProcess?.deadline?.length == 2)
                            && (!editProcess?.deadline?.every((val, i, arr) => val.deadline_days === arr[0].deadline_days))
                            && (
                                <FormControl>
                                    <FormLabel>Dias de prazo</FormLabel>
                                    <Input
                                        placeholder='Dias de prazo'
                                        variant={'filled'}
                                        type={'number'}
                                        maxLength={3}
                                        onChange={(event) => {setPrazoDefinitivo(event.target.value != ''
                                            ? new Date(new Date().setDate((editProcess?.created_at.toDate() ?? new Date()).getDate() + parseInt(event.target.value)))
                                            : new Date()); setProcessDaysFinal(parseInt(event.target.value)); }}
                                        value={processDaysFinal}
                                    />
                                    {processDaysFinal > 0 && (
                                        <Text
                                            color={'green.900'}
                                        >
                                            Prazo calculado: {prazoDefinitivo.toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </Text>)}
                                </FormControl>
                        )} */}

                        {editProcess?.accountable && (
                            <Text
                                fontSize={'1rem'}
                                fontWeight={'bold'}
                            >
                                Advogado Responsável: {analystList.find(x => x.uid == editProcess?.accountable)?.displayName}
                            </Text>
                        )}

                        {editProcess?.date_final && (
                            <Text
                                fontSize={'0.8rem'}
                                fontWeight={'bold'}
                                color={'blue.300'}
                            >
                                Data Final: {editProcess?.date_final != 'null' ? editProcess?.date_final : 'Sem Prazo'}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_internal_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[0]?.deadline_internal_date} por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_internal_date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_internal_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[1]?.deadline_internal_date} por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_internal_date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_court_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[0]?.deadline_court_date} por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_court_date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_court_date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[1]?.deadline_court_date} por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_court_date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_interpreter)?.displayName}
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
                            onClick={event => _handleUpdateProcess()}
                        >
                            Salvar
                        </Button>
                        <Button
                            colorScheme='red'
                            mr={3}
                            hidden={role != 'admin'}
                            onClick={() => _handleDeleteProcess()}
                        >
                            Deletar
                        </Button>
                        <Button onClick={() => [onCloseEdit(), cleanVariables()]}>
                            Fechar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Fragment>
    )
}

export default ProcessListPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    // const {['upsa.role']: upsaRole} = parseCookies(ctx);
    // const acceptedRules = ['admin', 'analyst', 'avocado']
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
