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
// import {db} from '../../services/firebase';
import {parseCookies} from "nookies";
import InputMask from 'react-input-mask';
import DataTableRCkakra from "../../Components/Table";
import { api } from '../../services/api';
import { ProcessType } from '../../models/ThemisTypes';
import { UserType } from '../../models/FirebaseTypes';
import { useRouter } from 'next/router';
import { logger } from '../../utils/logger';
import { useNavigation } from '../../hooks/useNavigation';
import { useIsMounted } from '../../hooks/useIsMounted';

const ProcessListPage: NextPage = () => {
    // const database = db;
    // const proccessCollection = collection(database, 'proccess');
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
    const { redirectToHome } = useNavigation();
    const isMounted = useIsMounted();

    useEffect(() => {
        if (user) {
            getProcess();
            getAnalystList();
        }

        if(upsaRole === null || upsaRole === undefined)  redirectToHome();
    }, [user, upsaRole, redirectToHome]);

    const getProcess = async () => {
        // const processQuery = query(proccessCollection, where('active', '==', true));
        // const querySnapshot = await getDocs(processQuery);

        const processQuery = await api.get('Process?size=90000')
        .then(data => {
            const querySnapshot: any[] = data.data.items;

            const result: ProcessType[] = [];
            querySnapshot.forEach((snapshot) => {
                // const itemUpdate = {
                //     // uid: snapshot.id,
                //     number: snapshot.number,
                //     author: snapshot.author,
                //     defendant: snapshot.defendant,
                //     decision: snapshot.decision,
                //     instance: snapshot.instance,
                //     accountable: snapshot.accountable,
                //     deadline: snapshot.deadline,
                //     created_At: snapshot.created_At,
                //     updated_At: snapshot.updated_At,
                //     active: snapshot.active,
                //     date_Final: snapshot.date_Final,
                //     themis_Id: snapshot.themis_Id,
                // } as ProcessType;
                // result.push(itemUpdate);
                // insertProcessDB(itemUpdate);
                result.push(snapshot);
            });

            setProcess(result);
        });
        
    };

    const updateProcessDB = async (process: ProcessType) => {

        const deadline1 = process.deadline[0] && {
            deadline_interpreter: process.deadline[0].deadline_Interpreter,
            deadline_court_date: process.deadline[0].deadline_Court_Date,
            deadline_internal_date: process.deadline[0].deadline_Internal_Date,
            checked: process.deadline[0].checked,
            created_at: process.deadline[0].created_At
        };

        const deadline2 = process.deadline[1] && {
            deadline_interpreter: process.deadline[1].deadline_Interpreter,
            deadline_court_date: process.deadline[1].deadline_Court_Date,
            deadline_internal_date: process.deadline[1].deadline_Internal_Date,
            checked: process.deadline[1].checked,
            created_at: process.deadline[1].created_At
        };

        const data = {
            number: process.number,
            author: process.author,
            defendant: process.defendant,
            decision: process.decision,
            instance: process.instance,
            accountable: process.accountable,
            themis_id: process.themis_Id,
            active: process.active,
            date_final: process.date_Final,
            created_at: process.created_At,
            updated_at: process.updated_At,
            deadline: [deadline1, deadline2]
        };

        const result = api.post(`Process/${process.uid}`, data)
            .then(result => {
                logger.debug('Process updated successfully:', result);
            });
    };

    const insertProcessDB = async (process: ProcessType) => {

        const deadline1 = process.deadline[0] && {
            deadline_interpreter: process.deadline[0].deadline_Interpreter,
            deadline_court_date: process.deadline[0].deadline_Court_Date,
            deadline_internal_date: process.deadline[0].deadline_Internal_Date,
            checked: process.deadline[0].checked,
            created_at: process.deadline[0].created_At
        };

        const deadline2 = process.deadline[1] && {
            deadline_interpreter: process.deadline[1].deadline_Interpreter,
            deadline_court_date: process.deadline[1].deadline_Court_Date,
            deadline_internal_date: process.deadline[1].deadline_Internal_Date,
            checked: process.deadline[1].checked,
            created_at: process.deadline[1].created_At
        };

        const data = {
            number: process.number,
            author: process.author,
            defendant: process.defendant,
            decision: process.decision,
            instance: process.instance,
            accountable: process.accountable,
            themis_id: process.themis_Id,
            active: process.active,
            date_final: process.date_Final,
            created_at: process.created_At,
            updated_at: process.updated_At,
            deadline: [deadline1, deadline2]
        };

        const result = api.put(`Process/${process.uid}`, data)
            .then(result => {
                logger.debug('Process created successfully:', result);
            });
    };

    const getAnalystList = async () => {
        const processQuery = await api.get(`User?size=90000`)
        .then(usuarios => {
            setAnalystList(usuarios.data.items ?? []);
        }).catch(function (error) {
            logger.error('Error fetching analyst list:', error);
        });
    };

    const _handleAddProcess = async () => {
        onOpen();
    };

    const _handleNewProcess = async () => {

        const snapProcess = await api.get(`Process/${processNumber}/number`);

        if(!snapProcess) {
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
            created_At: new Date()
        } as ProcessType;

        const docRef = await api.put(`Process/${processNumber}`, dataProcess);

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
    
            await api.post(`Process/${processNumber}`, dataProcessNode1);
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
            
        }).catch(function (error) {
            logger.error('Error fetching process from Themis:', error);
        });

        setEditProcess({...item, ['updated_At']: new Date() });
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
            const _processRef = await api.get(`Process/${editProcess?.uid}/number`);

            // const result = await api.post(`Process/${processNumber}`, dataProcessNode1);

            // const result = await updateDoc(_processRef, {
            //     author: editProcess?.author,
            //     defendant: editProcess?.defendant,
            //     decision: editProcess?.decision,
            //     updated_at: editProcess?.updated_At,
            //     //accountable: processDaysFinal > 0 ? user?.uid : null,
            //     //date_final: prazoDefinitivo ?? null
            // });

            // if(role === 'analyst' && processDays > 0) {
            //     const dataProcessNode1 = {
            //         deadline_days: processDays,
            //         deadline_date: prazo,
            //         deadline_interpreter: user?.uid,
            //         checked: false,
            //         created_at: Timestamp.now()
            //     };

            //     if(editProcess?.deadline?.find(x=>x.deadline_Interpreter == user?.uid))
            //     {
            //         await updateDoc(_processRef, {
            //             deadline: arrayRemove(editProcess?.deadline?.find(x=>x.deadline_Interpreter == user?.uid))
            //         });
            //     }
        
            //     await updateDoc(_processRef, {
            //         deadline: arrayUnion(dataProcessNode1)
            //     });
            // }

            // if(role ==='avocado' && processDaysFinal > 0) {
            //     const deadlines = editProcess?.deadline;

            //     deadlines?.forEach(async element => {
            //         await updateDoc(_processRef, {
            //             deadline: arrayRemove(element)
            //         });

            //         await updateDoc(_processRef, {
            //             deadline: arrayUnion({...element,
            //                 ['deadline_days']:processDaysFinal,
            //                 ['deadline_date']:prazoDefinitivo,
            //                 ['checked']:true})
            //         });
            //     });
            // }

            // await getProcess();

            // toast({
            //     title: 'Processo',
            //     description: "Processo alterado com sucesso",
            //     status: 'success',
            //     duration: 9000,
            //     isClosable: true,
            // });

        } catch (error) {
            logger.error('Error updating process:', error);

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
            await api.delete(`Process/${editProcess?.uid}`);

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
                                as={InputMask as any}
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
                        {(editProcess?.deadline
                            && editProcess?.deadline.length == 2
                            // && !editProcess?.deadline?.every((val, i, arr) => val.deadline_days === arr[0].deadline_days)
                            && !editProcess?.deadline?.every((val, i, arr) => val.deadline_Internal_Date === arr[0].deadline_Internal_Date)
                            && !editProcess.date_Final
                            ) && (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES
                            </Alert>
                        )}

                        <FormControl>
                            <FormLabel>Numero do processo</FormLabel>
                            <Input
                                as={InputMask as any}
                                variant={'filled'}
                                mask='9999999-99.9999.9.99.9999'
                                placeholder='Process number'
                                isRequired={true}
                                value={editProcess?.number}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['number']:event.target.value} : null)}
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
                        {editProcess?.deadline?.find(x=>x.deadline_Interpreter == user?.uid) && (!editProcess?.date_Final) && (
                            <FormControl>
                                <FormLabel>Dias de prazo</FormLabel>
                                <Input
                                    placeholder='Dias de prazo'
                                    variant={'filled'}
                                    type={'number'}
                                    maxLength={3}
                                    onChange={(event) => {setPrazo(event.target.value != ''
                                        ? new Date(new Date().setDate(editProcess?.created_At.getDate() + parseInt(event.target.value)))
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
                            || editProcess?.deadline?.filter(x => x.deadline_Interpreter == user?.uid).length == 0)
                            && (
                                <FormControl>
                                    <FormLabel>Dias de prazo</FormLabel>
                                    <Input
                                        placeholder='Dias de prazo'
                                        variant={'filled'}
                                        type={'number'}
                                        maxLength={3}
                                        onChange={(event) => {setPrazo(event.target.value != ''
                                            ? new Date(new Date().setDate((editProcess?.created_At ?? new Date()).getDate() + parseInt(event.target.value)))
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

                        {editProcess?.date_Final && (
                            <Text
                                fontSize={'0.8rem'}
                                fontWeight={'bold'}
                                color={'blue.300'}
                            >
                                Data Final: {editProcess?.date_Final || editProcess?.date_Final === 'null' ? 'Sem Prazo' : editProcess?.date_Final}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_Internal_Date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[0]?.deadline_Internal_Date} por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_Internal_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_Internal_Date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna {editProcess?.deadline[1]?.deadline_Internal_Date} por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_Internal_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Interna 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[0]?.deadline_Court_Date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[0]?.deadline_Court_Date} por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[0]?.deadline_Court_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[0]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        {editProcess?.deadline[1]?.deadline_Court_Date && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial {editProcess?.deadline[1]?.deadline_Court_Date} por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}
                        {editProcess?.deadline[1]?.deadline_Court_Date == null && (
                            <Text
                                fontSize={'0.8rem'}
                                color={'blue.300'}
                            >
                                Data Judicial 'Sem Prazo', por {analystList.find(x => x.uid == editProcess?.deadline[1]?.deadline_Interpreter)?.displayName}
                            </Text>
                        )}

                        <Text
                            fontSize={'0.6rem'}
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
