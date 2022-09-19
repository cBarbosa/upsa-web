import { db } from '../../../../services/firebase';
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
import {
    AddIcon,
    EditIcon,
    RepeatIcon
} from "@chakra-ui/icons";
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { api } from '../../../../services/api';
import { ProcessType } from '../../../../models/ThemisTypes';
import { UserType } from '../../../../models/FirebaseTypes';

const AnalystWaiting: NextPage = () => {
    const toast = useToast();
    const route = useRouter();
    const database = db;
    const proccessCollection = collection(database, 'proccess');
    const { isAuthenticated, role, user } = useAuth();
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

    useEffect(() => {
        if (user != null) {
            getProcessList().then(() => {
                if(upsaRole !='analyst') {
                    route.push('/');
                }
            });
        }
        getAvocadoList();
    }, []);

    const getProcessList = async () => {
        const processQuery = query(proccessCollection, where('active', '==', true));
        const querySnapshot = await getDocs(processQuery);

        const result:ProcessType[] = [];
        querySnapshot.forEach((snapshot) => {

            const hasAccountability = (snapshot.data() as ProcessType)?.deadline?.some(x => x.deadline_interpreter == user?.uid);
            const hasJustOneDeadline = (snapshot.data() as ProcessType)?.deadline?.length == 1;
            const hasTwoDeadlines = (snapshot.data() as ProcessType)?.deadline?.length == 2;

            if(!hasTwoDeadlines
                && (hasAccountability || (!hasAccountability && hasJustOneDeadline)))
            {
                result.push({
                    uid: snapshot.id,
                    number: snapshot.data().number,
                    author: snapshot.data().author,
                    defendant: snapshot.data().defendant,
                    decision: snapshot.data().decision,
                    accountable: snapshot.data().accountable,
                    instance: snapshot.data().instance,
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
        setIsCourtDeadline(false);
        setEditProcess({...item, ['updated_at']: Timestamp.now() });
        const _strInternalDate = `${item?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_internal_date}`;
        const _strCourtDate = `${item?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_court_date}`;

        const _internalDate = _strInternalDate == 'null' || _strInternalDate == 'undefined'
            ? new Date()
            : new Date(parseInt(_strInternalDate.split('/')[2]), parseInt(_strInternalDate.split('/')[1])-1, parseInt(_strInternalDate.split('/')[0]));
        const _courtDate = _strCourtDate == 'null' || _strCourtDate == 'undefined'
            ? new Date()
            : new Date(parseInt(_strCourtDate.split('/')[2]), parseInt(_strCourtDate.split('/')[1])-1, parseInt(_strCourtDate.split('/')[0]));
    
        if((_strInternalDate != 'null' && _strCourtDate != 'null')
            && (_strInternalDate != 'undefined' && _strCourtDate != 'undefined')) {
            setIsCourtDeadline(true);
        }

        setInternalDate(_strInternalDate != null ? _internalDate : new Date());
        setCourtDate(_strCourtDate != null ? _courtDate : new Date());
        onOpen();
    };

    const _handleUpdateProcess = async () => {

        try {
            const _processRef = doc(db, `proccess/${editProcess?.uid}`);
            const _nodeProcessRef = editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid);

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

                let _internalDate = editProcess?.deadline[0].deadline_internal_date == (!isCourtDeadline ? null : newInternalDate.toLocaleDateString('pt-BR',{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }));

                let _courtDate = editProcess?.deadline[0].deadline_court_date == (!isCourtDeadline ? null : newCourtDate.toLocaleDateString('pt-BR',{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }));

                const _date1 = `${editProcess?.deadline[0].deadline_internal_date}`;
                const _date2 = isCourtDeadline ? newInternalDate.toLocaleDateString('pt-BR',{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }) : 'null';
                const _court1 = `${editProcess?.deadline[0].deadline_court_date}`;
                const _court2 = isCourtDeadline ? newCourtDate.toLocaleDateString('pt-BR',{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }) : 'null';

                if(!_internalDate || !_courtDate) {
                    await _handleSendMessageDivergentProcessOnThemis(_date1, _date2, _court1, _court2);
                } else {
                    _handleSetFowardProcessOnThemis(_date2, _court2).then(result => {
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

                const dataProcessNode2 = {
                    deadline_internal_date: _date2,
                    deadline_court_date: _court2,
                    deadline_interpreter: user?.uid,
                    checked: false,
                    created_at: Timestamp.now()
                };

                const result = await updateDoc(_processRef, {
                    author: editProcess?.author,
                    defendant: editProcess?.defendant,
                    decision: editProcess?.decision,
                    updated_at: editProcess?.updated_at,
                    accountable: editProcess?.accountable ?? null,
                    date_final: (_date1 == _date2 && _court1 == _court2) ? _court1 : null,
                    deadline: arrayUnion(dataProcessNode2)
                });

                toast({
                    title: 'Processo',
                    description: 'Processo distribuído com sucesso',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
            } else { {/* Atualização do processo */}

                    const dataProcessNode1 = {
                    deadline_internal_date: isCourtDeadline ? internalDate.toLocaleDateString('pt-BR',{
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
                    created_at: _nodeProcessRef?.created_at ?? Timestamp.now(),
                    updated_at: Timestamp.now()
                };
    
                if(_nodeProcessRef)
                {
                    await updateDoc(_processRef, {
                        deadline: arrayRemove(_nodeProcessRef)
                    });
                }

                const result = await updateDoc(_processRef, {
                    author: editProcess?.author,
                    defendant: editProcess?.defendant,
                    decision: editProcess?.decision,
                    updated_at: editProcess?.updated_at,
                    accountable: editProcess?.accountable ?? null,
                    deadline: arrayUnion(dataProcessNode1)
                });

                toast({
                    title: 'Processo',
                    description: "Processo alterado com sucesso",
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
            }

            await getProcessList();
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

    const _handleSendMessageDivergentProcessOnThemis = async(
        _date1:string,
        _date2:string,
        _court1:string,
        _court2:string) => {

        const _mensagem = {
            'ProcessNumber': editProcess?.number,
            'InternalDate1': _date1 == 'null' ? 'Sem Prazo' : _date1,
            'InternalDate2': _date2 == 'null' ? 'Sem Prazo' : _date2,
            'CourtDate1': _court1 == 'null' ? 'Sem Prazo' : _court1,
            'CourtDate2': _court2 == 'null' ? 'Sem Prazo' : _court2,
            'Observation': editProcess?.decision
        };

        api.post(`message/notify-avocado`, _mensagem).then(result =>
        {
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
            console.log(error);
        });
    }

    const _handleGetProcessOnThemis = async (processNumber:string) => {

        api.get(`themis/process/${processNumber}`).then(result => {
            
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
            console.log(error);
        });

        return true;
    }

    const updateProcessNumberFromThemis = async (themis_id:number) => {
        const _processRef = doc(db, `proccess/${editProcess?.uid}`);

        await updateDoc(_processRef, {
            themis_id: themis_id
        });

        if(editProcess) {
            setEditProcess({...editProcess, ['themis_id']: themis_id });
            await getProcessList();
        }
    };

    const _handleSetFowardProcessOnThemis = async (
        _internalDate:string,
        _courtDate:string) => {
        
        const themisAvocadoId = avocadoList.find(x => x.uid == editProcess?.accountable)?.themis_id;

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
            "data": _internalDate == 'null' ? 'Sem Prazo' : _internalDate,
            "dataJudicial": _courtDate == 'null' ? 'Sem Prazo' : _courtDate,
            "descricao": editProcess?.decision,
            "advogado": {
               "id": themisAvocadoId
            }
        };


        api.put(`themis/process/add-foward/${editProcess?.number}`, _foward).then(result =>
        {
            if(result.data) {
                toast({
                    title: 'Processo (Themis)',
                    description: 'Processo distribuido com sucesso',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
            }
            return result.data;
        }).catch(function (error) {
            console.log(error);
            toast({
                title: 'Processo (Themis)',
                description: 'Não foi possível distribuir o processo',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        });
        return true;
    };

    const _handlePostProcessOnThemis = async (processNumber:string) => {

        if(processNumber == '') {
            return;
        }

        _handleGetProcessOnThemis(processNumber).then(result => {
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
                "id": avocadoList.find(x => x.uid == editProcess?.accountable)?.themis_id ?? null
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
            console.log(error);
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
    }

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

                        {(editProcess?.deadline !=null
                            && editProcess?.deadline.length == 2
                            && !editProcess?.deadline?.every((val, i, arr) => val.deadline_internal_date == arr[0].deadline_internal_date)
                            ) && (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES (Data Interna)
                            </Alert>
                        )}

                        {(editProcess?.deadline !=null
                            && editProcess?.deadline.length == 2
                            && !editProcess?.deadline?.every((val, i, arr) => val.deadline_court_date == arr[0].deadline_court_date)
                            ) && (
                            <Alert status='error' variant='left-accent'>
                                <AlertIcon />
                                INCONSISTÊNCIA DE DATAS DIVERGENTES (Data Judicial)
                            </Alert>
                        )}

                        <Flex>
                        <FormControl>
                            {editProcess?.themis_id && (
                                <Text>
                                    #{editProcess?.themis_id}
                                </Text>
                            )}

                            {editProcess?.themis_id == null && (
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
                        {!editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid) && !editProcess?.date_final && (
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
                                        Data Formatada: {newInternalDate.toLocaleDateString('pt-BR',{
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })}
                                    </Text>
                                    
                                </FormControl>
                                </Box>
                                
                                <Box padding = {2}>
                                <FormControl>
                                    <FormLabel>Prazo Judicial</FormLabel>
                                    <SingleDatepicker
                                        date={newCourtDate}
                                        onDateChange={(date:Date) => [setNewCourtDate(date), verifyDate(date, setNewCourtDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {newCourtDate.toLocaleDateString('pt-BR',{
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })}
                                    </Text>
                                </FormControl>
                                </Box>
                                
                            </Flex>
                        )}

                        {/* Escolhe o advogado responsável, somente se for o segundo analista */}
                        {(editProcess?.deadline?.length == 1)
                            && !editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)
                        &&(
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
                        {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid) && !editProcess?.date_final && (
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
                                        Data Formatada: {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_internal_date}
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
                                        Data Formatada: {editProcess?.deadline?.find(x=>x.deadline_interpreter == user?.uid)?.deadline_court_date}
                                    </Text>
                                </FormControl>
                                </Box>
                                
                            </Flex>
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
                                Data Final: {editProcess?.date_final}
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
}
