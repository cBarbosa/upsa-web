import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React from 'react';
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
    IconButton
 } from '@chakra-ui/react';
 import { EditIcon } from '@chakra-ui/icons';

 import { Avatar } from '@chakra-ui/react'

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

export default function UsersPage() {
    const database = db;
    const usersCollection = collection(db, 'users');

    const { user } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [ users, setUsers ] = useState<UserType[]>([]);
    const [ editUser, setEditUser ] = useState<UserType | null>(null);
    const [ editProfile, setEditProfile ] = useState<string>('none');

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
        <>
            <Heading as={'h3'}>
                Usuários
            </Heading>

            <Box>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </Box>
            <Flex>
                {users.map((item)=> {
                    return (
                            <Box
                                key={item.uid}>
                                    <Avatar
                                        name={item.displayName}
                                        src={item.photoURL}
                                        size={'sm'}
                                    />
                                { item.displayName } <br />
                                { item.email } <br />
                                { item.role } <br />

                                <IconButton
                                    ml={4}
                                    size='md'
                                    colorScheme='blue'
                                    variant='outline'
                                    aria-label='Editar cadastro'
                                    icon={<EditIcon />}
                                    onClick={()=>{updateUserModal(item)}}
                                />

                            </Box>
                        )
                })}
            </Flex>

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
        </>
    );
};
