import {collection, doc, getDocs, query, updateDoc, where} from 'firebase/firestore';
import React, {Fragment, useMemo} from 'react';
import {useEffect, useState} from 'react';
import {useAuth} from '../../Contexts/AuthContext';
import {db} from '../../services/firebase';
import {
    Text,
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input, Select,
    Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
    Divider,
    useDisclosure,
    Stack,
    IconButton,
    Table,
    TableCaption,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Tfoot,
    Container
} from '@chakra-ui/react';
import {EditIcon} from '@chakra-ui/icons';
import {Avatar} from '@chakra-ui/react';
import {GetServerSideProps} from 'next';
import {useRouter} from 'next/router';
import NavBar from '../../Components/NavBar';
import BottomNav from '../../Components/BottomNav';
import {parseCookies} from "nookies";
import DataTableRCkakra from "../../Components/Table";

type UserType = {
    uid: string;
    displayName: string;
    email: string;
    role: string;
    photoURL?: string;
    phoneNumber?: string;
    createdAt: string;
};

// const cityConverter = {
//     toFirestore: (city) => {
//         return {
//             name: city.name,
//             state: city.state,
//             country: city.country
//             };
//     },
//     fromFirestore: (snapshot, options) => {
//         const data = snapshot.data(options);
//         return new City(data.name, data.state, data.country);
//     }
// };

export default function UsersPage({data}: any) {
    const database = db;
    const usersCollection = collection(database, 'users');

    const {user, role, isAuthenticated} = useAuth();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const router = useRouter();
    const [users, setUsers] = useState<UserType[]>([]);
    const [editUser, setEditUser] = useState<UserType | null>(null);
    const [editProfile, setEditProfile] = useState<string>('none');

    // useEffect( () => {
    //     if (role != '' && role != 'admin') {
    //         router.push('/');
    //     }
    //  },[role]);

    useEffect(() => {
        getUsers();
    }, []);

    const getUsers = async () => {
        const usersQuery = query(usersCollection, where('role', '!=', 'admin'));
        const querySnapshot = await getDocs(usersQuery);

        // const result: QueryDocumentSnapshot<DocumentData>[] = [];
        const result: UserType[] = [];
        querySnapshot.forEach((snapshot) => {
            result.push({
                uid: snapshot.id,
                displayName: snapshot.data().displayName,
                role: snapshot.data().role,
                email: snapshot.data().email,
                photoURL: snapshot.data().photoURL,
                // createdAt: snapshot.data().createdAt.toDate().toLocaleDateString('pt-BR', {
                //     day: '2-digit',
                //     month: 'long',
                //     year: 'numeric'
                // })
                createdAt: snapshot.data().createdAt.toDate().toLocaleDateString('pt-BR')
            } as UserType);
        });
        setUsers(result);
    };

    const updateUserModal = (item: UserType) => {
        setEditUser(item);
        onOpen();
    };

    const _handleUpdateUser = async () => {

        try {
            const _user = doc(db, `users/${editUser?.uid}`);

            await updateDoc(_user, {
                role: editProfile
            } as UserType);

            getUsers();
        } catch (error) {
            console.log(error);
        }

        onClose();
    };

    const _handleDeleteuser = async () => {
        console.debug(editUser);
    };

    const roles = (role: string) => {
        switch (role) {
            case 'avocado':
                return 'Advogado'
                break;
            case 'admin':
                return 'Administrador'
                break;
            case 'analyst':
                return 'Analista'
                break;
            case 'candidate':
                return 'Candidato'
                break;
            case 'none':
                return 'Sem permissão'
                break;
            default:
                return 'Sem regra';
        }
    }
    const columns = useMemo(
        () => [
            {
                Header: 'Nome',
                accessor: 'name',
            },
            {
                Header: 'Email',
                accessor: 'email',
            },
            {
                Header: 'Permissão',
                accessor: 'role',
                isNumeric: true,
            },
            {
                Header: 'Dt. Criação',
                accessor: 'date',
            },
            {
                Header: 'Editar',
                accessor: 'edit',
            }
        ],
        [],
    )

    function editUserFromData(user: UserType) {
        return (<IconButton
            ml={4}
            size='md'
            colorScheme='blue'
            variant='outline'
            aria-label='Editar cadastro'
            icon={<EditIcon/>}
            onClick={() => {
                updateUserModal(user)
            }}
        />)
    }

    function editNameFromData(user: UserType) {
        return ( <Box display={'flex'} flexDirection={'row'} alignItems={'center'}>
            <Avatar
                name={user.displayName}
                src={user.photoURL}
                size={'sm'}
            />
            <Text ml={4}>
                {user.displayName}
            </Text>
        </Box>)
    }

    function getUsersFromData() {
        const arrData: { name: object; email: string; role: string; date: string; edit: object; }[] = []
        users.map(user => {
            arrData.push({
                name: editNameFromData(user),
                email: user.email,
                role: roles(user.role),
                date: user.createdAt,
                edit: editUserFromData(user)
            })
        })
        return arrData
    }

    const dataTable = useMemo(
        () => getUsersFromData(), [user],
    )


    return (
        <Fragment>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                <Heading color={'gray.600'}>
                    Usuários
                </Heading>
                {users.length === 0 && (
                    <Box py={10}>
                        <Text>
                            Não existe usuário para liberação
                        </Text>
                    </Box>
                )}
                {users.length > 0 && (
                    <Box py={30}>
                        <DataTableRCkakra columns={columns} data={getUsersFromData()}/>
                    </Box>
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
                    <ModalHeader>Dados do usuário</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>
                        <FormControl>
                            <FormLabel>Nome</FormLabel>
                            <Input
                                placeholder='Display Name'
                                variant={'filled'}
                                disabled={true}
                                value={editUser?.displayName || ''}
                            />
                        </FormControl>

                        <FormControl mt={4}>
                            <FormLabel>Email</FormLabel>
                            <Input
                                placeholder='Email'
                                variant={'filled'}
                                disabled={true}
                                value={editUser?.email || ''}
                            />
                        </FormControl>

                        <FormControl mt={4}>
                            <FormLabel>Perfil</FormLabel>
                            <Select
                                placeholder='Escolha o perfil'
                                size={'md'}
                                variant={'flushed'}
                                value={editProfile}
                                onChange={(event) => setEditProfile(event.target.value)}
                            >
                                <option value='none' selected={editUser?.role == 'none'}>Candidato</option>
                                <option value='analyst' selected={editUser?.role == 'analyst'}>Analista</option>
                                <option value='avocado' selected={editUser?.role == 'avocado'}>Advogado</option>
                            </Select>
                        </FormControl>

                        <Divider orientation='horizontal'/>

                        <Stack
                            direction={['column', 'row']}
                            pt={6}
                        >
                            <Text
                                fontSize={'md'}
                                as={'i'}
                            >
                                Cadastrado em:
                            </Text>

                            <Text
                                fontSize={'md'}
                                color='tomato'
                                as={'i'}
                            >
                                {editUser?.createdAt}
                            </Text>
                        </Stack>

                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            onClick={_handleUpdateUser}
                        >
                            Salvar
                        </Button>
                        <Button
                            colorScheme='red'
                            mr={3}
                            onClick={_handleDeleteuser}
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
    );
};


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    // const database = db;
    // const usersCollection = collection(db, 'users');

    // let result:UserType[] = [];

    // const getUsers = async () => {
    //     const usersQuery = query(usersCollection, where('role', '!=', 'admin'));
    //     const querySnapshot = await getDocs(usersQuery);
    //     // const result: QueryDocumentSnapshot<DocumentData>[] = [];

    //     querySnapshot.forEach((snapshot) => {
    //         result.push({
    //             uid: snapshot.id,
    //             displayName: snapshot.data().displayName,
    //             role: snapshot.data().role,
    //             email: snapshot.data().email,
    //             photoURL: snapshot.data().photoURL,
    //             // createdAt: snapshot.data().createdAt.toDate().toLocaleDateString('pt-BR', {
    //             //     day: '2-digit',
    //             //     month: 'long',
    //             //     year: 'numeric'
    //             // })
    //             createdAt: snapshot.data().createdAt.toDate().toLocaleDateString('pt-BR')
    //         } as UserType);
    //     });
    // };

    const {['upsa.role']: upsaRole} = parseCookies(ctx);
    const acceptedRules = ['admin']
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