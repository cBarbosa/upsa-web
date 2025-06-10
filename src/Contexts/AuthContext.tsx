import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User
} from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import {
    auth,
    db
} from "../services/firebase";
import {
    destroyCookie,
    setCookie
} from 'nookies';
import { api } from "../services/api";
import { UserType } from "../models/FirebaseTypes";
import { logger } from '../utils/logger';

interface IUser extends User {
    role: string;
}

interface IAuthentication {
    user: UserType | null,
    role: string,
    isAuthenticated: boolean,
    login: () => void,
    logout: () => void,
    // getDbLoggedProfile: () => Promise<string>
};

const authentication = auth;
const database = db;

const AuthContext = createContext<IAuthentication>({
    login: async () => {},
    logout: () => {},
    user: null,
    role: '',
    isAuthenticated: false,
    // getDbLoggedProfile: async () => new Promise<string>(() => '')
});

const AuthProvider = ({ children }: React.PropsWithChildren ) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [role, setRole] = useState<string>('none');

    useEffect(()=> {
        const unsubscribe = onAuthStateChanged(authentication, (user) => {
            
            if(user) {
                api.get(`User/${user.uid}`).then(res => {
                    if(res.data.success) {
                        const userData = res.data.data;
                        setUser(userData);
                        
                        // Definir o role do contexto quando o usuário for carregado
                        if (userData.role) {
                            setRole(userData.role);
                            
                            // Sincronizar cookie
                            setCookie(null, 'upsa.role', userData.role, {
                                maxAge: 30 * 24 * 60 * 60,
                            });
                        }
                    }
                }).catch(error => {
                    logger.error('Error fetching user data:', error);
                });
            } else {
                setUser(null);
                setRole('none');
                destroyCookie(null, 'upsa.role');
            }
            
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            const { user } = await signInWithPopup(authentication, new GoogleAuthProvider());

            const userDB = await api.get(`User/${user.uid}`);

            if(!userDB.data.success) {
                await api.put(`User/${user.uid}`, {
                    displayName: user.displayName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    photoUrl: user.photoURL,
                    providerId: user.providerId,
                    role: 'none', // Role padrão para novos usuários
                    createdAt: serverTimestamp()
                });
            }

            const userData = userDB.data?.data;
            
            if (userData) {
                setUser(userData);
                setRole(userData.role || 'none');
                
                // Sincronizar cookie
                setCookie(null, 'upsa.role', userData.role || 'none', {
                    maxAge: 30 * 24 * 60 * 60,
                });
            }

        } catch (error) {
            logger.error('Error in user authentication:', error);
        }
    }

    const logout = async () => {
        try {
            await signOut(authentication);
            setUser(null);
            setRole('none');
            destroyCookie(null, 'upsa.role');
        } catch (error) {
            logger.error('Error signing out user:', error);
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, role, login, logout }}>
            { children }
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
