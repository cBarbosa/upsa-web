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
    AlertDescription,
    Stack,
    Switch
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../../../services/firebase";
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
import { useRouter } from "next/router";
import DataTableRCkakra from '../../../../Components/Table';
import {
    EditIcon,
    RepeatIcon
} from "@chakra-ui/icons";
import InputMask from 'react-input-mask';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { api } from "../../../../services/api";
import { ProcessType, DeadLineProcessType } from '../../../../models/ThemisTypes';
import { UserType } from '../../../../models/FirebaseTypes';
import { optionsLocaleDateString } from "../../analyst/create";
import logger from "../../../../utils/logger";

const AvocadoPending: NextPage = () => {

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
    const [internalDate, setInternalDate] = useState(new Date());
    const [courtDate, setCourtDate] = useState(new Date());
    const [isCourtDeadline, setIsCourtDeadline] = useState(false);
    const [loading, setLoading] = useState(false);

    const [internalDateAdd, setInternalDateAdd] = useState(new Date());
    const [courtDateAdd, setCourtDateAdd] = useState(new Date());
    const [isCourtDeadlineAdd, setIsCourtDeadlineAdd] = useState(false);

    useEffect(() => {

        if (user) {
            getProcessList();
            getAvocadoList();
        }

        if(upsaRole !== 'avocado')  route.push('/');

    }, [user]);

    const getProcessList = async () => {
        setLoading(true);
        // const processQuery = query(proccessCollection, where('active', '==', true));
        // const querySnapshot = await getDocs(processQuery);

        const processQuery = await api.get(`Process?size=90000`).then(processos => {
            
            const querySnapshot:ProcessType[] = processos.data.items;
            let result: ProcessType[] = [];

            querySnapshot.forEach(snapshot => {

            const hasInternalDateDivergency = !snapshot?.deadline?.every((val, i, arr) => val.deadline_Internal_Date === arr[0].deadline_Internal_Date);
            const hasCourtDateDivergency = !snapshot?.deadline?.every((val, i, arr) => val.deadline_Court_Date === arr[0].deadline_Court_Date);
            const hasTwoDeadlines = snapshot?.deadline?.length == 2;
            const isAlreadyResolved = !!snapshot.date_Final;

            if(hasTwoDeadlines
                && (hasInternalDateDivergency || hasCourtDateDivergency)
                && !isAlreadyResolved) {
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
        const isInternalDateConvergent = item.deadline[0].deadline_Internal_Date == item.deadline[1].deadline_Internal_Date;
        const isCourtDateConvergent = item.deadline[0].deadline_Court_Date == item.deadline[1].deadline_Court_Date;

        if(isInternalDateConvergent) {
            const _strInternalDate = `${item.deadline[0].deadline_Internal_Date}`;
            const _internalDate = new Date(
                parseInt(_strInternalDate.split('/')[2]),
                parseInt(_strInternalDate.split('/')[1])-1,
                parseInt(_strInternalDate.split('/')[0])
            );
            setInternalDate(_internalDate);
        }

        if(isCourtDateConvergent) {
            const _strCourtDate = `${item.deadline[0].deadline_Court_Date}`;
            const _courtDate = new Date(
                parseInt(_strCourtDate.split('/')[2]),
                parseInt(_strCourtDate.split('/')[1])-1,
                parseInt(_strCourtDate.split('/')[0])
            );
            setCourtDate(_courtDate);
        }
        onOpen();
    };

    const _handleUpdateProcess = async () => {

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

        if(isCourtDeadlineAdd && (internalDateAdd <= new Date())) {
            toast({
                title: 'Processo',
                description: "O Prazo Interno deve ser maior que a data atual",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if(isCourtDeadlineAdd && (courtDateAdd <= internalDateAdd)) {
            toast({
                title: 'Processo',
                description: "O Prazo judicial deve ser maior que o Prazo Interno",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if(editProcess?.decision == '') {
            toast({
                title: 'Processo',
                description: 'Necessário informar a descrição do processo judicial',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        const _internalDate = isCourtDeadline ? internalDate.toLocaleDateString('pt-BR', optionsLocaleDateString) : null;
        const _courtDate = isCourtDeadline ? courtDate.toLocaleDateString('pt-BR', optionsLocaleDateString) : null;

        const _internalDateAdd = isCourtDeadlineAdd ? internalDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString) : null;
        const _courtDateAdd = isCourtDeadlineAdd ? courtDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString) : null;

        try {
            // const _processRef = doc(db, `proccess/${editProcess?.uid}`);
            let newDeadlines: DeadLineProcessType[] = [];

            editProcess?.deadline?.forEach(element => {
                newDeadlines.push({...element, 'checked': true});
            });

            editProcess!.deadline = [];
            editProcess!.deadline = newDeadlines;
            editProcess!.date_Final = _courtDate ?? 'Sem Prazo';

            if(_internalDate !== null && _courtDate !== null) {

                await _handleSetFowardProcessOnThemis(editProcess!, _internalDate!, _courtDate!, _internalDateAdd!, _courtDateAdd!)
                    .then(themisResult => {
                        toast({
                            title: 'Processo (Themis)',
                            description: themisResult?.message ?? 'Não foi possível distribuir o processo',
                            status: themisResult?.success ? 'success' : 'error',
                            duration: 9000,
                            isClosable: true
                        });

                        if(themisResult?.success) {
                            // setIsSaving(false);
                            //_closeModal();
                        }
                    }).catch(function (error) {
                        console.error(error);
                    });
            }

        } catch (error) {

            toast({
                title: 'Processo',
                description: `Erro atualizando o processo: ${error}`,
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        } finally {
            await getProcessList();
            cleanVariables();
            onClose();
        }
    };

    const _handleSetFowardProcessOnThemis = async (
        _processUpdate: ProcessType,
        _internalDate:string,
        _courtDate:string,
        _internalDateAdd?: string | null,
        _courtDateAdd?:string | null) => {

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
            "dataInternaAdicional": _internalDateAdd,
            "dataJudicialAdicional": _courtDateAdd,
            "descricao": editProcess?.decision,
            "advogado": {
               "id": themisAvocadoId
            }
        };

        const processUpdate = {
            process: _processUpdate,
            foward: _foward
        };

        logger.info('processUpdate', processUpdate);

        return api.put(`themis/process/add-foward/${editProcess?.number}`, processUpdate)
            .then(result => {

                return result.data;

            }).catch(function (error) {
                logger.error('Error distributing process:', error);
                toast({
                    title: 'Processo (Themis)',
                    description: error ??'Não foi possível distribuir o processo',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
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

    const cleanVariables = () => {
        setEditProcess(null);
        setInternalDate(new Date());
        setCourtDate(new Date());
    }

    const myFormDataEditable = editProcess?.deadline?.find(
        x=>x.deadline_Interpreter == user?.uid
    );
    const isDeadLineEveryInternal = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Internal_Date == arr[0].deadline_Internal_Date
    );
    const isDeadLineEveryCourt = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Court_Date == arr[0].deadline_Court_Date
    );
    const isDeadLineEveryInternalAdd = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Internal_Date_Add == arr[0].deadline_Internal_Date_Add
    );
    const isDeadLineEveryCourtAdd = editProcess?.deadline?.every(
        (val, i, arr) => val.deadline_Court_Date_Add == arr[0].deadline_Court_Date_Add
    );
    const formInViewmode = editProcess?.deadline.length === 2;
    const formInEditmode = editProcess?.deadline.length === 1;

    return (
        <>
            <Head>
                <title>UPSA - Divergências</title>
            </Head>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Flex justifyContent={'space-between'}>
                    <Heading color={'gray.600'}>
                        Divergências
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
                    <ModalHeader>Dados do processo (Distribuição)</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>

                        <Flex>
                        <FormControl>
                            <FormLabel>Numero do processo</FormLabel>
                            <Input
                                as={InputMask as any}
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
                                onChange={event => setEditProcess(editProcess != null ? {...editProcess, ['decision']:event.target.value} : null)}
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

                        <Flex>
                            <Box padding = {2}>
                                <FormControl hidden={!isCourtDeadline}>
                                    <FormLabel>Prazo Interno</FormLabel>
                                    <SingleDatepicker
                                        date={internalDate}
                                        onDateChange={(date:Date) => [setInternalDate(date), verifyDate(date, setInternalDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {internalDate.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                    
                                </FormControl>

                                {formInViewmode && !isDeadLineEveryInternal && (
                                        <Stack spacing={1}>
                                            <Alert status='error' variant='left-accent'>
                                                <AlertIcon />
                                                <Box flex='1'>
                                                    <AlertTitle>
                                                        {avocadoList.find(x => x.uid == editProcess?.deadline[0].deadline_Interpreter)?.displayName}
                                                    </AlertTitle>
                                                    <AlertDescription display='block'>
                                                        {`${editProcess?.deadline[0].deadline_Internal_Date}` == null ? 'Sem Prazo' : editProcess?.deadline[0].deadline_Internal_Date}
                                                    </AlertDescription>
                                                </Box>
                                            </Alert>

                                            <Alert status='error' variant='left-accent'>
                                                <AlertIcon />
                                                <Box flex='1'>
                                                    <AlertTitle>
                                                        {avocadoList.find(x => x.uid == editProcess?.deadline[1].deadline_Interpreter)?.displayName}
                                                    </AlertTitle>
                                                    <AlertDescription display='block'>
                                                        {`${editProcess?.deadline[1].deadline_Internal_Date}` == null ? 'Sem Prazo' : editProcess?.deadline[1].deadline_Internal_Date}
                                                    </AlertDescription>
                                                </Box>
                                            </Alert>
                                        </Stack>
                                )}
                            </Box>

                            <Box padding = {2} >
                                <FormControl hidden={!isCourtDeadline}>
                                    <FormLabel>Prazo Judicial</FormLabel>
                                    <SingleDatepicker
                                        date={courtDate}
                                        onDateChange={(date:Date) => [setCourtDate(date), verifyDate(date, setCourtDate, internalDate)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {courtDate.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                    
                                </FormControl>

                                {formInViewmode && !isDeadLineEveryCourt && (
                                    <Stack spacing={1}>
                                        <Alert status='error' variant='left-accent'>
                                            <AlertIcon />
                                            <Box flex='1'>
                                                <AlertTitle>
                                                    {avocadoList.find(x => x.uid == editProcess?.deadline[0].deadline_Interpreter)?.displayName}
                                                </AlertTitle>
                                                <AlertDescription display='block'>
                                                    {`${editProcess?.deadline[0].deadline_Court_Date}` == null ? 'Sem Prazo': editProcess?.deadline[0].deadline_Court_Date}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>

                                        <Alert status='error' variant='left-accent'>
                                            <AlertIcon />
                                            <Box flex='1'>
                                                <AlertTitle>
                                                    {avocadoList.find(x => x.uid == editProcess?.deadline[1].deadline_Interpreter)?.displayName}
                                                </AlertTitle>
                                                <AlertDescription display='block'>
                                                    {`${editProcess?.deadline[1].deadline_Court_Date}` == null ? 'Sem Prazo' : editProcess?.deadline[1].deadline_Court_Date}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    </Stack>
                                )}
                            </Box>

                        </Flex>

                        {myFormDataEditable?.deadline_Internal_Date
                        && myFormDataEditable?.deadline_Court_Date && (
                            <Alert status='info' variant='left-accent'>
                                <AlertIcon />
                                <Text
                                    paddingRight={5}
                                >
                                    Data Interna: {myFormDataEditable?.deadline_Internal_Date}
                                </Text>
                                -
                                <Text
                                    paddingLeft={5}
                                >
                                    Data Judicial: {myFormDataEditable?.deadline_Court_Date}
                                </Text>
                            </Alert>
                        )}

                        <Flex
                            justify="center"
                            align="center"
                            hidden={!isCourtDeadline}
                            padding={5}
                        >
                            <FormLabel htmlFor="date-add">
                                Este processo tem prazo judicial adicional?
                            </FormLabel>
                            <Switch
                                id="date-add"
                                checked={isCourtDeadlineAdd}
                                onChange={event => setIsCourtDeadlineAdd(event.target.checked)}
                            />
                        </Flex>

                        <Flex>
                            <Box padding = {2}>
                                <FormControl hidden={!isCourtDeadlineAdd}>
                                    <FormLabel>Prazo Interno</FormLabel>
                                    <SingleDatepicker
                                        date={internalDateAdd}
                                        onDateChange={(date:Date) => [setInternalDateAdd(date), verifyDate(date, setInternalDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {internalDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                    
                                </FormControl>

                                {formInViewmode && !isDeadLineEveryInternalAdd && (
                                        <Stack spacing={1}>
                                            <Alert status='error' variant='left-accent'>
                                                <AlertIcon />
                                                <Box flex='1'>
                                                    <AlertTitle>
                                                        {avocadoList.find(x => x.uid == editProcess?.deadline[0].deadline_Interpreter)?.displayName}
                                                    </AlertTitle>
                                                    <AlertDescription display='block'>
                                                        {!editProcess?.deadline[0].deadline_Internal_Date_Add ? 'Sem Prazo' : editProcess?.deadline[0].deadline_Internal_Date_Add}
                                                    </AlertDescription>
                                                </Box>
                                            </Alert>

                                            <Alert status='error' variant='left-accent'>
                                                <AlertIcon />
                                                <Box flex='1'>
                                                    <AlertTitle>
                                                        {avocadoList.find(x => x.uid == editProcess?.deadline[1].deadline_Interpreter)?.displayName}
                                                    </AlertTitle>
                                                    <AlertDescription display='block'>
                                                        {!editProcess?.deadline[1].deadline_Internal_Date_Add ? 'Sem Prazo' : editProcess?.deadline[1].deadline_Internal_Date_Add}
                                                    </AlertDescription>
                                                </Box>
                                            </Alert>
                                        </Stack>
                                )}
                            </Box>

                            <Box padding = {2} >
                                <FormControl hidden={!isCourtDeadlineAdd}>
                                    <FormLabel>Prazo Judicial</FormLabel>
                                    <SingleDatepicker
                                        date={courtDateAdd}
                                        onDateChange={(date:Date) => [setCourtDateAdd(date), verifyDate(date, setCourtDateAdd, internalDateAdd)]}
                                    />
                                    <Text
                                        fontSize={'0.8rem'}
                                        color={'GrayText'}
                                    >
                                        Data Formatada: {courtDateAdd.toLocaleDateString('pt-BR', optionsLocaleDateString)}
                                    </Text>
                                    
                                </FormControl>

                                {formInViewmode && !isDeadLineEveryCourtAdd && (
                                    <Stack spacing={1}>
                                        <Alert status='error' variant='left-accent'>
                                            <AlertIcon />
                                            <Box flex='1'>
                                                <AlertTitle>
                                                    {avocadoList.find(x => x.uid == editProcess?.deadline[0].deadline_Interpreter)?.displayName}
                                                </AlertTitle>
                                                <AlertDescription display='block'>
                                                    {!editProcess?.deadline[0].deadline_Court_Date_Add ? 'Sem Prazo': editProcess?.deadline[0].deadline_Court_Date_Add}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>

                                        <Alert status='error' variant='left-accent'>
                                            <AlertIcon />
                                            <Box flex='1'>
                                                <AlertTitle>
                                                    {avocadoList.find(x => x.uid == editProcess?.deadline[1].deadline_Interpreter)?.displayName}
                                                </AlertTitle>
                                                <AlertDescription display='block'>
                                                    {!editProcess?.deadline[1].deadline_Court_Date_Add ? 'Sem Prazo' : editProcess?.deadline[1].deadline_Court_Date_Add}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    </Stack>
                                )}
                            </Box>

                        </Flex>

                        {editProcess?.accountable && (
                            <Text
                                fontSize={'1rem'}
                                fontWeight={'bold'}
                            >
                                Advogado Responsável: {avocadoList.find(x => x.uid == editProcess?.accountable)?.displayName}
                            </Text>
                        )}

                        {editProcess?.date_Final != null && (
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
                        <Button onClick={() => onClose()}>
                            Fechar
                        </Button>
                    </ModalFooter>
                </ModalContent>
          </Modal>
        </>
    );
}

export default AvocadoPending;

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
