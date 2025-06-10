import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import React, {Fragment, useMemo} from 'react';
import {useEffect, useState} from 'react';
import {useAuth} from '../../Contexts/AuthContext';
import {db} from '../../services/firebase';
import {
    Text,
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Divider,
    useDisclosure,
    Stack,
    IconButton,
    Container,
    useToast
} from '@chakra-ui/react';
import {EditIcon} from '@chakra-ui/icons';
import {Avatar} from '@chakra-ui/react';
import {GetServerSideProps} from 'next';
import {useRouter} from 'next/router';
import NavBar from '../../Components/NavBar';
import BottomNav from '../../Components/BottomNav';
import {parseCookies} from "nookies";
import DataTableRCkakra from "../../Components/Table";
import { UserType } from '../../models/FirebaseTypes';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import { useNavigation } from '../../hooks/useNavigation';
import { setCookie } from 'nookies';

export default function UsersPage({data}: any) {
    const database = db;
    const toast = useToast();
    const route = useRouter();
    const {user, role, isAuthenticated} = useAuth();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [users, setUsers] = useState<UserType[]>([]);
    const [editUser, setEditUser] = useState<UserType | null>(null);
    const [editProfile, setEditProfile] = useState<string>('none');
    const {['upsa.role']: upsaRole} = parseCookies(null);
    const { redirectToHome } = useNavigation();

    useEffect(() => {
        logger.debug('Users page - useEffect triggered:', { 
            user: !!user, 
            upsaRole, 
            userRole: user?.role,
            contextRole: role,
            isAuthenticated 
        });

        if (user) {
            getUsers();
            
            // Sincronizar cookie com o role atual do usuário
            if (user.role && user.role !== upsaRole) {
                logger.debug(`Users page - Updating cookie role from ${upsaRole} to ${user.role}`);
                setCookie(null, 'upsa.role', user.role, {
                    maxAge: 30 * 24 * 60 * 60,
                });
            }
        }

        // Só verificar permissões se o usuário estiver completamente carregado
        if (user && isAuthenticated && user.role) {
            const currentRole = user.role; // Usar apenas o role do usuário autenticado
            
            logger.debug('Users page - Permission check:', { 
                currentRole,
                allowedRoles: ['admin', 'avocado'],
                isAllowed: ['admin', 'avocado'].includes(currentRole)
            });

            // Permitir acesso para admin e avocado
            if (!['admin', 'avocado'].includes(currentRole)) {
                logger.debug('Users page - ACCESS DENIED - Redirecting user with role:', currentRole);
                redirectToHome();
            } else {
                logger.debug('Users page - ACCESS GRANTED for role:', currentRole);
            }
        }

    }, [user, upsaRole, role, isAuthenticated, redirectToHome]);

    const getUsers = async () => {
        const processQuery = await api.get('User?size=90000');

        const querySnapshot:UserType[] = processQuery.data.items;

        setUsers(querySnapshot);

    };

    const updateUserModal = (item: UserType) => {
        setEditUser(item);
        onOpen();
    };

    const _handleUpdateUser = async () => {

        try {
            const _user = await api.post(`User/${editUser?.uid}`, {
                role: editProfile
            });

            if(!_user.data.success) {
                toast({
                    title: 'Usuário',
                    description: _user.data.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            }

            toast({
                title: 'Usuário',
                description: "Usuário atualizado com sucesso",
                status: 'success',
                duration: 9000,
                isClosable: true,
            });
            getUsers();
        } catch (error) {
            logger.error('Error updating user:', error);
        }

        onClose();
    };

    const _handleDeleteuser = async () => {
        try {
            const _user = doc(db, `users/${editUser?.uid}`);
            await deleteDoc(_user);

            toast({
                title: 'Usuário',
                description: "Usuário deletado com sucesso",
                status: 'success',
                duration: 9000,
                isClosable: true,
            });

            getUsers();
        } catch (error) {
            logger.error('Error deleting user:', error);
        }

        onClose();
    };

    const roles = (role: string) => {
        let _role = '';

        switch (role) {
            case 'avocado':
                _role = 'Advogado';
                break;
            case 'admin':
                _role = 'Administrador';
                break;
            case 'analyst':
                _role = 'Analista';
                break;
            case 'candidate':
                _role = 'Candidato';
            case 'none':
                _role = 'Candidato';
                break;
            default:
                _role = 'Sem regra';
        }

        return _role;
    };

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
                accessor: 'role'
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
    );

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
                src={user.photoUrl}
                size={'sm'}
            />
            <Text ml={4}>
                {user.displayName}
            </Text>
        </Box>)
    }

    function getUsersFromData() {
        const arrData: { name: object; email: string; role: string; date: string; edit: object; }[] = [];
        users.map(user => {
            arrData.push({
                name: editNameFromData(user),
                email: user.email,
                role: roles(user.role),
                date: user.createdAt,
                edit: editUserFromData(user)
            });
        });
        return arrData;
    }

    const dataTable = useMemo(
        () => getUsersFromData(), [user],
    );

    return (
        <Fragment>
            <NavBar/>
            <Container minH={'calc(100vh - 142px)'} maxW='container.xl' py={10}>
                
                {/* Debug Info - Remover após debug */}
                {process.env.NODE_ENV === 'development' && (
                    <Box mb={4} p={4} bg="yellow.100" borderRadius="md">
                        <Text fontWeight="bold">Debug Info:</Text>
                        <Text>User: {user ? 'Logged in' : 'Not logged in'}</Text>
                        <Text>User Role: {user?.role || 'undefined'}</Text>
                        <Text>Context Role: {role || 'undefined'}</Text>
                        <Text>Cookie Role: {upsaRole || 'undefined'}</Text>
                        <Text>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
                        <Text>Current Role: {user?.role || role || upsaRole || 'undefined'}</Text>
                    </Box>
                )}

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
                                onChange={(event) => setEditProfile(event.target.value)}
                                aria-label="Selecionar perfil do usuário"
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
    return {
        props: {}
    };
}
