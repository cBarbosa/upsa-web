import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import DataTableRCkakra from '../../../../Components/Table';
import Head from "next/head";
import {
    GetServerSideProps,
    NextPage
} from "next/types";
import BottomNav from '../../../../Components/BottomNav';
import NavBar from '../../../../Components/NavBar';
import { useAuth } from '../../../../Contexts/AuthContext';
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
    useToast,
    Select,
    Alert,
    AlertIcon,
    Switch
} from "@chakra-ui/react";
import InputMask from 'react-input-mask';
import {
    AddIcon,
    EditIcon,
    RepeatIcon
} from "@chakra-ui/icons";
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { api } from '../../../../services/api';
import {
    DeadLineProcessType,
    ProcessType
} from '../../../../models/ThemisTypes';
import { UserType } from '../../../../models/FirebaseTypes';
import { optionsLocaleDateString } from "../create";

const AnalystWaiting: NextPage = () => {
    const toast = useToast();
    const route = useRouter();
    // const database = db;
    // const proccessCollection = collection(database, 'proccess');
    const { role, user } = useAuth();
    const [processList, setProcessList] = useState<ProcessType[]>([]);
    const [avocadoList, setAvocadoList] = useState<UserType[]>([]);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [editProcess, setEditProcess] = useState<ProcessType | null>(null);
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const [internalDate, setInternalDate] = useState(new Date());
    const [courtDate, setCourtDate] = useState(new Date());
    const [newInternalDate, setNewInternalDate] = useState(new Date());
    const [newCourtDate, setNewCourtDate] = useState(new Date());
    const [isCourtDeadline, setIsCourtDeadline] = useState(false);
    const [internalDateAdd, setInternalDateAdd] = useState(new Date());
    const [courtDateAdd, setCourtDateAdd] = useState(new Date());
    const [isCourtDeadlineAdd, setIsCourtDeadlineAdd] = useState(false);
    const [newInternalDateAdd, setNewInternalDateAdd] = useState(new Date());
    const [newCourtDateAdd, setNewCourtDateAdd] = useState(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (user) {
            getProcessList();
            getAvocadoList();
        }

        if(upsaRole !== 'analyst')  route.push('/');

    }, [user]);

    const getProcessList = async () => {
        setLoading(true);
        // const processQuery = query(proccessCollection, where('active', '==', true));
        // const querySnapshot = await getDocs(processQuery);

        const processQuery = await api.get(`Process?size=90000`).then(processos => {

            const querySnapshot:ProcessType[] = processos.data.items;
            let result: ProcessType[] = [];

            querySnapshot.forEach(snapshot => {
                // const hasAccountability = snapshot?.deadline?.some(x => x.deadline_Interpreter == 'DG4C4zFPkZgcHIddrpGMj4ajVjm2');
                const hasAccountability = snapshot?.deadline?.some(x => x.deadline_Interpreter == user?.uid);
                const hasJustOneDeadline = snapshot?.deadline?.length === 1;
                const hasTwoDeadlines = snapshot?.deadline?.length === 2;
                const hasFinalProcess = snapshot.date_Final !== undefined && snapshot.date_Final !== 'null';

                if(!hasTwoDeadlines
                    && (hasAccountability || (!hasAccountability && hasJustOneDeadline))) {
                    result.push(snapshot);
                }

                // if(hasAccountability || hasJustOneDeadline) {
                //     result.push(snapshot);
                // }

                // if(!hasTwoDeadlines
                //     && (hasAccountability || (!hasAccountability && hasJustOneDeadline))) {
                //         console.log(snapshot)
                //     result.push(snapshot);
                // }

                // if(!hasFinalProcess) {
                //      result.push(snapshot);
                // }

            });

            setProcessList(result);
        })
        .catch(function (error) {
            console.error(error);
        })
        .finally(() => setLoading(false));
    };

    const getAvocadoList = async () => {
        // const processQuery = query(collection(database, 'users'));
        // const querySnapshot = await getDocs(processQuery);

        const processQuery = await api.get(`User?size=90000`)
        .then(usuarios => {

            // const querySnapshot: UserType[] = usuarios.data.items;
            // let result: UserType[] = [];

            // querySnapshot.forEach((snapshot) => {
            //     result.push(snapshot);
            // });

            setAvocadoList(usuarios.data.items ?? []);
        }).catch(function (error) {
            console.error(error);
        });
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
        setIsCourtDeadline(false);
        setEditProcess({...item, ['updated_At']: new Date() });

        if(!user) return;

        const _strInternalDate = item?.deadline?.find(x=>x.deadline_Interpreter == user?.uid)?.deadline_Internal_Date;
        const _strCourtDate = item?.deadline?.find(x=>x.deadline_Interpreter == user?.uid)?.deadline_Court_Date;
        const _strInternalDateAdd = item?.deadline?.find(x=>x.deadline_Interpreter == user?.uid)?.deadline_Internal_Date_Add;
        const _strCourtDateAdd = item?.deadline?.find(x=>x.deadline_Interpreter == user?.uid)?.deadline_Court_Date_Add;

        const _internalDate = !_strInternalDate
            ? new Date()
            : new Date(parseInt(_strInternalDate.split('/')[2]), parseInt(_strInternalDate.split('/')[1])-1, parseInt(_strInternalDate.split('/')[0]));

        const _courtDate = !_strCourtDate
            ? new Date()
            : new Date(parseInt(_strCourtDate.split('/')[2]), parseInt(_strCourtDate.split('/')[1])-1, parseInt(_strCourtDate.split('/')[0]));

        const _internalDateAdd = !_strInternalDateAdd
            ? new Date()
            : new Date(parseInt(_strInternalDateAdd.split('/')[2]), parseInt(_strInternalDateAdd.split('/')[1])-1, parseInt(_strInternalDateAdd.split('/')[0]));

        const _courtDateAdd = !_strCourtDateAdd
            ? new Date()
            : new Date(parseInt(_strCourtDateAdd.split('/')[2]), parseInt(_strCourtDateAdd.split('/')[1])-1, parseInt(_strCourtDateAdd.split('/')[0]));

        if((_strInternalDate != null && _strCourtDate != null)
            && (_strInternalDate != undefined && _strCourtDate != undefined)) {
            setIsCourtDeadline(true);
        }

        if((_strInternalDateAdd != null && _strCourtDateAdd != null)
            && (_strInternalDateAdd != undefined && _strCourtDateAdd != undefined)) {
            setIsCourtDeadlineAdd(true);
        }

        setInternalDate(_strInternalDate != null ? _internalDate : new Date());
        setCourtDate(_strCourtDate != null ? _courtDate : new Date());
        setInternalDateAdd(_strInternalDateAdd != null ? _internalDateAdd : new Date());
        setCourtDateAdd(_strCourtDateAdd != null ? _courtDateAdd : new Date());
        onOpen();
    };

    const _handleUpdateProcess = async () => {

        try {
            // const _processRef = doc(db, `proccess/${editProcess?.uid}`);

            const _nodeProcessRef = editProcess?.deadline?.find(
                x => x.deadline_Interpreter == user?.uid
            );

            {/* Distribuição de processo */}
            if(!_nodeProcessRef) {

                if(!editProcess?.accountable) {
                    toast({
                        title: 'Processo',
                        description: 'Escolha um advogado responsável',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    });
                    return;
                }

                if(isCourtDeadline && (newInternalDate <= new Date())) {
                    toast({
                        title: 'Processo',
                        description: 'O Prazo Interno deve ser maior que a data atual',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    });
                    return;
                }
        
                if(isCourtDeadline && (newCourtDate <= newInternalDate)) {
                    toast({
                        title: 'Processo',
                        description: 'O Prazo judicial deve ser maior que o Prazo Interno',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    });
                    return;
                }

                const _internalDate = editProcess?.deadline[0].deadline_Internal_Date == (!isCourtDeadline ? null : newInternalDate.toLocaleDateString('pt-BR', optionsLocaleDateString));
                const _courtDate = editProcess?.deadline[0].deadline_Court_Date == (!isCourtDeadline ? null : newCourtDate.toLocaleDateString('pt-BR', optionsLocaleDateString));

                const _date1 = editProcess?.deadline[0].deadline_Internal_Date;
                const _date2 = isCourtDeadline
                    ? newInternalDate.toLocaleDateString('pt-BR', optionsLocaleDateString)
                    : undefined;
                const _date3 = isCourtDeadlineAdd
                    ? newInternalDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)
                    : undefined;
                const _court1 = editProcess?.deadline[0].deadline_Court_Date;
                const _court2 = isCourtDeadline
                    ? newCourtDate.toLocaleDateString('pt-BR', optionsLocaleDateString)
                    : undefined;
                const _court3 = isCourtDeadlineAdd
                    ? newCourtDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)
                    : undefined;

                if(!_internalDate || !_courtDate) {
                    await _handleSendMessageDivergentProcessOnThemis(_date1, _date2, _court1, _court2);
                } else {
                    if(_date2 && _court2) {
                        // só distribui se as datas estiverem preenchidas
                        _handleSetFowardProcessOnThemis(_date2, _court2)
                        .then(result => {
                            if(!result) {
                                toast({
                                    title: 'Processo (Themis)',
                                    description: 'Não foi possível distribuir o processo',
                                    status: 'error',
                                    duration: 9000,
                                    isClosable: true,
                                });
                                return;
                            }
                        });
                    }
                }

                const dataProcessNode2 = {
                    deadline_Internal_Date: _date2,
                    deadline_Court_Date: _court2,
                    deadline_Internal_Date_Add: _date3,
                    deadline_Court_Date_Add: _court3,
                    deadline_Interpreter: user?.uid,
                    checked: false,
                    created_At: new Date()
                } as DeadLineProcessType;

                editProcess?.deadline.push(dataProcessNode2);

                const result = await api.post(`Process/${editProcess?.uid!}`, editProcess)
                .then(update => {
                    toast({
                        title: 'Processo',
                        description: update.data.message,
                        status: 'success',
                        duration: 9000,
                        isClosable: true,
                    });
                }).catch(function (error) {
                    console.error(error);
                });
            } else { {/* Atualização do processo */}

                const dataProcessNode1 = {
                    deadline_Internal_Date: isCourtDeadline ? internalDate.toLocaleDateString('pt-BR',optionsLocaleDateString) : undefined,
                    deadline_Court_Date: isCourtDeadline ? courtDate.toLocaleDateString('pt-BR',optionsLocaleDateString) : undefined,
                    deadline_Internal_Date_Add: isCourtDeadlineAdd ? internalDateAdd.toLocaleDateString('pt-BR',optionsLocaleDateString) : undefined,
                    deadline_Court_Date_Add: isCourtDeadlineAdd ? courtDateAdd.toLocaleDateString('pt-BR',optionsLocaleDateString) : undefined,
                    deadline_Interpreter: user?.uid,
                    checked: false,
                    created_At: _nodeProcessRef?.created_At ?? new Date(),
                    updated_At: new Date()
                } as DeadLineProcessType;

                const index = editProcess!.deadline.findIndex(
                    d => d.deadline_Interpreter == user?.uid
                );

                editProcess?.deadline.splice(index, 1);
                editProcess?.deadline.push(dataProcessNode1);
    
                const result = await api.post(`Process/${editProcess?.uid}`, editProcess)
                    .then(update => {
                    toast({
                        title: 'Processo',
                        description: update.data.message,
                        status: 'success',
                        duration: 9000,
                        isClosable: true,
                    });
                }).catch(function (error) {
                    console.error(error);
                });
            }

            await getProcessList();
        } catch (error) {
            console.error(error);

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

    const _handleSendMessageDivergentProcessOnThemis = async(
        _date1?:string,
        _date2?: string,
        _court1?:string,
        _court2?: string) => {

        const _mensagem = {
            'ProcessNumber': editProcess?.number,
            'InternalDate1': _date1 ?? 'Sem Prazo',
            'InternalDate2': _date2 ?? 'Sem Prazo',
            'CourtDate1': _court1 ?? 'Sem Prazo',
            'CourtDate2': _court2 ?? 'Sem Prazo',
            'Observation': editProcess?.decision
        };

        return api.post(`message/notify-avocado`, _mensagem)
            .then(result => {
                if(result.data) {
                    toast({
                        title: 'Processo',
                        description: "Divergência enviada para os advogados",
                        status: 'info',
                        duration: 9000,
                        isClosable: true,
                    });
                }
            }).catch(function (error) {
                console.error(error);
            });
    }

    const _handleGetProcessOnThemis = async (processNumber: string): Promise<boolean> => {

        api.get(`themis/process/${processNumber}`)
        .then(result => {
            
            if(result.status === 204) {
                return false;
            }

            updateProcessNumberFromThemis(result?.data?.id).then( _ => {
                toast({
                    title: 'Processo (Themis)',
                    description: 'Processo atualizado com as informações do Themis',
                    status: 'info',
                    duration: 9000,
                    isClosable: true,
                });
            });
        }).catch(function (error) {
            console.error(error);
        });

        return true;
    };

    const updateProcessNumberFromThemis = async (themis_id:number) => {
        // const _processRef = doc(db, `proccess/${editProcess?.uid}`);

        // await updateDoc(_processRef, {
        //     themis_id: themis_id
        // });

        await api.post(`Process/${editProcess?.uid}`, editProcess).then(async edit => {
            toast({
                title: 'Processo',
                description: edit.data.message,
                status: 'info',
                duration: 9000,
                isClosable: true,
            });

            if(editProcess) {
                setEditProcess({...editProcess, ['themis_Id']: themis_id });
                await getProcessList();
            }

        }).catch(function (error) {
            console.error(error);
        });
    };

    const _handleSetFowardProcessOnThemis = async (
        _internalDate: string,
        _courtDate: string) => {

        const themisAvocadoId = avocadoList.find(
            x => x.uid == editProcess?.accountable
        )?.themis_Id;

        if(!themisAvocadoId) {
            toast({
                title: 'Processo',
                description: 'Não foi possível distribuir o processo, advogado escolhido está sem vínculo com o Themis',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        const _foward = {
            "data": _internalDate,
            "dataJudicial": _courtDate,
            "descricao": editProcess?.decision,
            "advogado": {
               "id": themisAvocadoId
            }
        };

        return api.put(`themis/process/add-foward/${editProcess?.number}`, _foward)
            .then(result => {
            if(result.data) {
                toast({
                    title: 'Processo (Themis)',
                    description: 'Processo distribuido com sucesso',
                    status: 'success',
                    duration: 9000,
                    isClosable: true
                });
            }
            return result.data;
        }).catch(function (error) {
            console.error(error);
            toast({
                title: 'Processo (Themis)',
                description: 'Não foi possível distribuir o processo',
                status: 'error',
                duration: 9000,
                isClosable: true
            });
        });
    };

    const _handlePostProcessOnThemis = async (processNumber:string) => {

        if(!processNumber || processNumber == '') {
            return;
        }

        _handleGetProcessOnThemis(processNumber)
        .then(result => {
            if(result) {
                return;
            }
        });

        if(!editProcess?.accountable) {
            toast({
                title: 'Processo',
                description: 'Um advogado precisa definido para cadastrar o processo no Themis',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        const _newProcess = {
            "numero": editProcess?.number,
            "tipo": "1",
            "titulo": editProcess?.decision,
            "oculto": 0,
            "parteAtiva": "1",
            "advogado": {
                "id": avocadoList.find(x => x.uid == editProcess?.accountable)?.themis_Id ?? null
            },
            "cliente": {
                "id": 5
            },
            "area": {
                "id": 12
            },
            "acao": {
                "id": 35
            },
            "dominio": {
                "id": 1
            },
            "instancia": {
                "id": 1
            },
            "parteInteressada": {
                "id": 5
            },
            "posicaoParte": {
                "id": 90
            }
        };

        api.put(`themis/process`, _newProcess).then(result =>
        {
            if(result.data) {
                toast({
                    title: 'Processo (Themis)',
                    description: "Processo cadastrado com sucesso",
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
            }
        }).catch(function (error) {
            console.error(error);
            toast({
                title: 'Processo (Themis)',
                description: 'Não foi cadastrar o processo',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        });
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

    const cleanVariables = async () => {
        setEditProcess(null);
        setInternalDate(new Date());
        setCourtDate(new Date());
        setNewInternalDate(new Date());
        setNewCourtDate(new Date());

        setIsCourtDeadline(false);
        setIsCourtDeadlineAdd(false);
    }

    const verifyDate = async (ref: Date, func: Function, ref2: Date | undefined = undefined) => {

        const dateCompare = new Date();
        dateCompare.setHours(0, 0, 0, 0);

        if(dateCompare > ref) {
            toast({
                title: 'Processo',
                description: "A data informada deve pode ser menor que hoje!",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            func(dateCompare);
        }

        if(ref2) {
            const refCompare = new Date(ref2);

            refCompare.setDate(refCompare.getDate() + 2);
            refCompare.setHours(0, 0, 0, 0);

            if(ref < refCompare) {
                toast({
                    title: 'Processo',
                    description: `A data informada deve ser maior que ${refCompare.toLocaleDateString()}!`,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
                func(refCompare);
            }
        }
    };

    const isFormEditable = editProcess?.deadline?.find(
        x=>x.deadline_Interpreter == user?.uid
    );
    const isDeadLineEveryInternal = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Internal_Date == arr[0].deadline_Internal_Date
    );
    const isDeadLineEveryCourt = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Court_Date == arr[0].deadline_Court_Date
    );
    const formInViewmode = editProcess?.deadline.length === 2;
    const formInEditmode = editProcess?.deadline.length === 1;

    return (
        <>
          <Head>
            <title>UPSA - Prazos Interpretados</title>
          </Head>
  
          <NavBar/>

            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Flex justifyContent={'space-between'}>
                    <Heading color={'gray.600'}>
                        Prazos Interpretados
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

          <BottomNav />

          <Modal
                isOpen={isOpen}
                onClose={onClose}
                closeOnOverlayClick={false}
                size={'xl'}
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Dados do processo (Atualização)</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>

                        {(formInViewmode && !isDeadLineEveryInternal) && (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES (Data Interna)
                            </Alert>
                        )}

                        {(formInViewmode && !isDeadLineEveryCourt)&& (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES (Data Judicial)
                            </Alert>
                        )}

                        <Flex>
                        <FormControl>
                            {editProcess?.themis_Id && (
                                <Text>
                                    #{editProcess?.themis_Id}
                                </Text>
                            )}

                            {editProcess?.themis_Id == null && (
                                <Button
                                    colorScheme={'blue'}
                                    onClick={() => _handlePostProcessOnThemis(editProcess?.number ?? '')}
                                >
                                    <AddIcon w={4}/>
                                </Button>
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
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['author']:event.target.value} : null)}
                                value={editProcess?.author}
                                readOnly={true}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Parte interessada</FormLabel>
                            <Input
                                placeholder='Réu'
                                variant={'filled'}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['defendant']:event.target.value} : null)}
                                value={editProcess?.defendant}
                                readOnly={true}
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

                        <Flex
                            justify="center"
                            align="center"
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

                        {/* Visualização das informações permitindo nova inserção */}
                        {!isFormEditable && !editProcess?.date_Final && (
                            <>
                            <Flex hidden={!isCourtDeadline}>
                                <Box
                                    padding = {2}
                                    paddingRight= {10}
                                >
                                <FormControl>
                                    <FormLabel>Prazo Interno</FormLabel>
                                    <SingleDatepicker
                                        date={newInternalDate}
                                        onDateChange={(date:Date) => [setNewInternalDate(date), verifyDate(date, setNewInternalDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {newInternalDate.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                    
                                </FormControl>
                                </Box>
                                
                                <Box padding = {2}>
                                <FormControl>
                                    <FormLabel>Prazo Judicial</FormLabel>
                                    <SingleDatepicker
                                        date={newCourtDate}
                                        onDateChange={(date:Date) => [setNewCourtDate(date), verifyDate(date, setNewCourtDate, newInternalDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {newCourtDate.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                </FormControl>
                                </Box>
                                
                            </Flex>

                            <Flex
                                justify="center"
                                align="center"
                                padding={5}
                                hidden={!isCourtDeadline}
                            >
                                <FormLabel htmlFor="date-add">
                                    Este processo tem prazo judicial adicional?
                                </FormLabel>
                                <Switch
                                    id="date-add"
                                    defaultIsChecked={isCourtDeadlineAdd}
                                    onChange={event => setIsCourtDeadlineAdd(event.target.checked)}
                                />
                            </Flex>

                            <Flex hidden={!isCourtDeadlineAdd}>
                                <Box
                                    padding = {2}
                                    paddingRight= {10}
                                >
                                <FormControl>
                                    <FormLabel>Prazo Interno adicional</FormLabel>
                                    <SingleDatepicker
                                        date={newInternalDateAdd}
                                        onDateChange={(date:Date) => [setNewInternalDateAdd(date), verifyDate(date, setNewInternalDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {newInternalDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>

                                </FormControl>
                                </Box>
                                
                                <Box padding = {2}>
                                <FormControl>
                                    <FormLabel>Prazo Judicial adicional</FormLabel>
                                    <SingleDatepicker
                                        date={newCourtDateAdd}
                                        onDateChange={(date:Date) => [setNewCourtDateAdd(date), verifyDate(date, setNewCourtDateAdd, newCourtDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {newCourtDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                </FormControl>
                                </Box>
                                
                            </Flex>
                            </>
                        )}

                        {/* Escolhe o advogado responsável, somente se for o segundo analista */}
                        {formInEditmode && !isFormEditable &&(
                        <FormControl mt={4}>
                            <FormLabel>Responsável</FormLabel>
                            <Select
                                placeholder='Escolha o responsável'
                                variant={'filled'}
                                value={editProcess?.accountable}
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['accountable']:event.target.value} : null)}
                            >
                                {avocadoList?.map((adv) => {
                                    return(
                                        <option
                                            key={adv.uid}
                                            selected={adv.uid == editProcess?.accountable}
                                            value={adv.uid}
                                        >
                                            {adv.displayName}
                                        </option>
                                    )
                                })}
                            </Select>
                        </FormControl>
                        )}

                        {/* Visualização das informações permitindo a edição */}
                        {isFormEditable && !editProcess?.date_Final && (
                            <>
                            <Flex hidden={!isCourtDeadline}>
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
                                        Data Formatada: {isFormEditable?.deadline_Internal_Date}
                                    </Text>
                                    
                                </FormControl>
                                </Box>
                                
                                <Box padding = {10}>
                                <FormControl>
                                    <FormLabel>Prazo Judicial</FormLabel>
                                    <SingleDatepicker
                                        date={courtDate}
                                        onDateChange={(date:Date) => [setCourtDate(date), verifyDate(date, setCourtDate, internalDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {isFormEditable?.deadline_Court_Date}
                                    </Text>
                                </FormControl>
                                </Box>
                                
                            </Flex>

                            <Flex
                                justify="center"
                                align="center"
                                padding={5}
                                hidden={!isCourtDeadline}
                            >
                                <FormLabel htmlFor="date-add">
                                    Este processo tem prazo judicial adicional?
                                </FormLabel>
                                <Switch
                                    id="date-add"
                                    defaultIsChecked={isCourtDeadlineAdd}
                                    onChange={event => setIsCourtDeadlineAdd(event.target.checked)}
                                />
                            </Flex>

                            <Flex hidden={!isCourtDeadlineAdd}>
                                <Box padding = {10}>
                                <FormControl>
                                    <FormLabel>Prazo Interno adicional</FormLabel>
                                    <SingleDatepicker
                                        date={internalDateAdd}
                                        onDateChange={(date:Date) => [setInternalDateAdd(date), verifyDate(date, setInternalDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {isFormEditable?.deadline_Internal_Date_Add}
                                    </Text>
                                    
                                </FormControl>
                                </Box>

                                <Box padding = {10}>
                                <FormControl>
                                    <FormLabel>Prazo Judicial adicional</FormLabel>
                                    <SingleDatepicker
                                        date={courtDateAdd}
                                        onDateChange={(date:Date) => [setCourtDateAdd(date), verifyDate(date, setCourtDateAdd, internalDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {isFormEditable?.deadline_Court_Date_Add}
                                    </Text>
                                </FormControl>
                                </Box>

                            </Flex>
                            </>
                        )}

                        {editProcess?.accountable && (
                            <Text
                                fontSize={'1rem'}
                                fontWeight={'bold'}
                            >
                                Advogado Responsável: {avocadoList.find(x => x.uid == editProcess?.accountable)?.displayName}
                            </Text>
                        )}

                        {editProcess?.date_Final && (
                            <Text
                                fontSize={'0.8rem'}
                                fontWeight={'bold'}
                                color={'blue.300'}
                            >
                                Data Final: {editProcess?.date_Final}
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

export default AnalystWaiting;

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
};
