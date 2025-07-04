import {ElementType, ReactNode} from 'react';
import {
    Box,
    Flex,
    Avatar,
    HStack,
    Link,
    IconButton,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useDisclosure,
    useColorModeValue,
    Stack,
    Center,
    Text,
    Image
} from '@chakra-ui/react';
import {HamburgerIcon, CloseIcon} from '@chakra-ui/icons';
import {LinkProps as ChakraLinkProps} from "@chakra-ui/react";
import {useAuth} from '../../Contexts/AuthContext';
import {useRouter} from 'next/router';
import {FcGoogle} from 'react-icons/fc';
import { logger } from '../../utils/logger';
import { useNavigation } from '../../hooks/useNavigation';

const Links = [
    { label: 'Home', to: '/', rule: ['admin', 'analyst', 'avocado', 'candidate', 'none'] },
    /* Admin */
    { label: 'Processos', to: '/process', rule: ['admin'] },
    /* Avocado */
    { label: 'Usuários', to: '/users', rule: ['admin', 'avocado'] },
    { label: 'Divergência', to: '/profile/avocado/pending', rule: ['avocado'] },
    { label: 'Distribuidos', to: '/profile/avocado/done', rule: ['avocado'] },
    /* Analyst */
    { label: 'Cadastrar Prazo', to: '/profile/analyst/create', rule: ['analyst'] },
    { label: 'Interpretados', to: '/profile/analyst/waiting', rule: ['analyst'] },
    { label: 'Distribuidos', to: '/profile/analyst/done', rule: ['analyst'] },
];

interface NavLinkProps extends ChakraLinkProps {
    icon?: ElementType,
    children: ReactNode;
    href: string;
}

const NavLink = ({children, href, ...rest}: NavLinkProps) => (
    <Link
        px={2}
        py={1}
        rounded={'md'}
        _hover={{
            textDecoration: 'none',
            bg: useColorModeValue('gray.200', 'gray.700'),
        }}
        href={href}
        {...rest}
    >
        {children}
    </Link>
);

export default function NavBar() {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const router = useRouter();
    const {user, login, logout, role} = useAuth();
    const { redirectToHome } = useNavigation();

    const _handleLogoutUser = async () => {
        try {
            await logout();
            redirectToHome();
        } catch (error) {
            logger.error('Error during sign out:', error);
        }
    };

    return (
        <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
            <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                <IconButton
                    size={'md'}
                    icon={isOpen ? <CloseIcon/> : <HamburgerIcon/>}
                    aria-label={'Open Menu'}
                    display={{md: 'none'}}
                    onClick={isOpen ? onClose : onOpen}
                />
                <HStack spacing={8} alignItems={'center'}>
                    <Box>
                        <Image src='/assets/images/logomarca.jpg' height={20} p={3} alt={'UPSA'}/>
                    </Box>
                    <HStack
                        as={'nav'}
                        spacing={4}
                        display={{base: 'none', md: 'flex'}}>
                        {user && (Links.map((link) => (
                            link.rule.includes(user.role) && <NavLink key={link.label} href={link.to}>{link.label}</NavLink>
                        )))}
                    </HStack>
                </HStack>
                {user && (<Flex alignItems={'center'}>
                    <Menu>
                        <MenuButton
                            as={Button}
                            rounded={'full'}
                            variant={'link'}
                            cursor={'pointer'}
                            minW={0}>
                            <Avatar
                                size={'sm'}
                                src={user?.photoUrl ?? ''}
                            />
                            <Text>
                                {user.displayName}
                            </Text>
                        </MenuButton>
                        <MenuList>
                            {/*<MenuItem>Link 1</MenuItem>*/}
                            {/*<MenuItem>Link 2</MenuItem>*/}
                            {/*<MenuDivider/>*/}
                            <MenuItem
                                onClick={_handleLogoutUser}
                            >
                                Sair
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>)}
                {!user && (
                    <Button
                        maxW={'200px'}
                        variant={'outline'}
                        leftIcon={<FcGoogle/>}
                        color={'gray.600'}
                        borderColor={'gray.300'}
                        background={'gray.100'}
                        onClick={login}
                    >
                        <Center>
                            <Text>Entrar</Text>
                        </Center>
                    </Button>
                )}
            </Flex>

            {isOpen ? (
                <Box pb={4} display={{md: 'none'}}>
                    <Stack as={'nav'} spacing={4}>
                        {Links.map((link) => (
                            <NavLink key={link.label} href={link.to}>{link.label}</NavLink>
                        ))}
                    </Stack>
                </Box>
            ) : null}
        </Box>
    );
}
