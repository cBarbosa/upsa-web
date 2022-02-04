import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { Fragment } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import { db } from '../../services/firebase';
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
    Tfoot
 } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { Avatar } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import NavBar from '../../Components/NavBar';
import BottomNav from '../../Components/BottomNav';

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

export default function UsersPage( {data}:any) {
    const database = db;
    const usersCollection = collection(database, 'users');

    const { user, role, isAuthenticated } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const router = useRouter();
    const [ users, setUsers ] = useState<UserType[]>([]);
    const [ editUser, setEditUser ] = useState<UserType | null>(null);
    const [ editProfile, setEditProfile ] = useState<string>('none');

    // useEffect( () => {
    //     if (role != '' && role != 'admin') {
    //         router.push('/');
    //     }
    //  },[role]);

    useEffect( () => {
        getUsers();
     },[]);

     const getUsers = async () => {
        const usersQuery = query(usersCollection, where('role', '!=', 'admin'));
        const querySnapshot = await getDocs(usersQuery);
        
        // const result: QueryDocumentSnapshot<DocumentData>[] = [];
        const result:UserType[] = [];
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
            const _user = doc(db,`users/${editUser?.uid}`);

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

    return(
        <Fragment>
            <NavBar/>
            <Heading p={3}>
                Usuários
            </Heading>

            {users.length === 0 && (
                <Box>
                    <Text>
                        Não existe usuário para liberação
                    </Text>
                </Box>
            )}

            {users.length > 0 && (
                <Flex>
                    <Table variant={'striped'} colorScheme={'blackAlpha'}>
                    <TableCaption>Lista de usuários do sistema</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Nome</Th>
                            <Th>Email</Th>
                            <Th>Permissão</Th>
                            <Th>Dt. Criação</Th>
                            <Th></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                    {users.map((item)=> {
                        return (
                        <Tr key={item.uid}>
                            <Td>
                                <Avatar
                                    name={item.displayName}
                                    src={item.photoURL}
                                    size={'sm'}
                                />
                                <Text>
                                    {item.displayName}
                                </Text>
                            </Td>
                            <Td>
                                <Text>
                                    {item.email}
                                </Text>
                            </Td>
                            <Td>
                                <Text>
                                    {item.role}
                                </Text>
                            </Td>
                            <Td>
                                <Text>
                                    {item.createdAt}
                                </Text>
                            </Td>
                            <Td>
                                <IconButton
                                    ml={4}
                                    size='md'
                                    colorScheme='blue'
                                    variant='outline'
                                    aria-label='Editar cadastro'
                                    icon={<EditIcon />}
                                    onClick={()=>{updateUserModal(item)}}
                                />
                            </Td>
                        </Tr>
                        )
                        })}
                    </Tbody>
                    <Tfoot>
                        <Tr>
                            <Th>Nome</Th>
                            <Th>Email</Th>
                            <Th>Permissão</Th>
                            <Th>Dt. Criação</Th>
                            <Th></Th>
                        </Tr>
                    </Tfoot>
                    </Table>
                    {/* {users.map((item)=> {
                        return (
                                <Box
                                    key={item.uid}>
                                        <Avatar
                                            name={item.displayName}
                                            src={item.photoURL}
                                            size={'sm'}
                                        />
                                        <Stack direction={'row'}>
                                            <Text>{ item.displayName }</Text>
                                            <Text>{ item.email }</Text>
                                            <Text>{ item.role }</Text>
                                            <Text>{ item.createdAt }</Text>

                                            <IconButton
                                                ml={4}
                                                size='md'
                                                colorScheme='blue'
                                                variant='outline'
                                                aria-label='Editar cadastro'
                                                icon={<EditIcon />}
                                                onClick={()=>{updateUserModal(item)}}
                                            />
                                    </Stack>

                                </Box>
                            )
                    })} */}
                </Flex>
            )}
            
            <BottomNav />

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                closeOnOverlayClick={false}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Dados do usuário</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                    <FormControl>
                        <FormLabel>Nome</FormLabel>
                        <Input
                            placeholder='Display Name'
                            variant={'filled'}
                            disabled={true}
                            value={ editUser?.displayName || ''}
                        />
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Email</FormLabel>
                        <Input
                            placeholder='Email'
                            variant={'filled'}
                            disabled={true}
                            value={ editUser?.email || ''}
                        />
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Perfil</FormLabel>
                            <Select
                                    placeholder='Escolha o perfil'
                                    size={'md'}
                                    variant={'flushed'}
                                    value={editProfile}
                                    onChange={(event) => setEditProfile(event.target.value) }
                            >
                                <option value='none' selected={editUser?.role=='none'} >Candidato</option>
                                <option value='analyst' selected={editUser?.role=='analyst'} >Analista</option>
                                <option value='avocado' selected={editUser?.role=='avocado'} >Advogado</option>
                            </Select>
                    </FormControl>

                    <Divider orientation='horizontal' />

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

    return {
        props: {
            // users: result,
            protected: true,
            userTypes: ['admin']
        }
    };
}