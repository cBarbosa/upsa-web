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
                        setUser(res.data.data);
                    }
                });
            } else {
                setUser(null);
            }
            
        });
        return unsubscribe;
    }, []);

    useEffect(()=> {
        getDbLoggedProfile().then((result) => {
            setRole(result);
        });
    }, [user]);

    const login = async () => {
        try {
            const { user } = await signInWithPopup(authentication, new GoogleAuthProvider());
            let res = user as IUser;

            const userDB = await api.get(`User/${user.uid}`);

            if(!userDB.data.success)    {
                await api.put(`User/${res.uid}`, {
                    displayName: res.displayName,
                    email: res.email,
                    phoneNumber: res.phoneNumber,
                    photoUrl: res.photoURL,
                    providerId: res.providerId,
                    role: res.role,
                    createdAt: serverTimestamp()
                  });
            }

            const snap = userDB.data?.data;
            res.role = snap.role;

            // console.log('userDb', userDB);
            // console.log('snap', snap);
            // console.log('role', res.role);

            // const ref = doc(database, 'users', res.uid);
            // const snap = await getDoc(ref);

            // if(!snap.exists()) {
            //     res.role = 'none';
            //     await setDoc(doc(database, 'users', res.uid), {
            //         displayName: res.displayName,
            //         email: res.email,
            //         phoneNumber: res.phoneNumber,
            //         photoURL: res.photoURL,
            //         providerId: res.providerId,
            //         role: res.role,
            //         createdAt: serverTimestamp()
            //       });
            // };

            // res.role = snap.get('role');
            
            setRole(res.role);
            setUser(snap);
            setCookie(null, 'upsa.role', res.role, {
                maxAge: 30 * 24 * 60 * 60,
            });

        } catch (error) {
            console.error(error);
        }
    }

    const logout = async () => {
        try {
            await signOut(authentication).then(r => {
                destroyCookie(null, 'upsa.role');
            });
        } catch (error) {
            console.error(error);
        }
    }

    const getDbLoggedProfile = async () => {
        try {
            if(role === '' && user) {
                const ref = doc(database, 'users', user.uid);
                const snap = await getDoc(ref);
                return snap.get('role');
            }
            return '';
        } catch (error) {
            console.error(error);
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
