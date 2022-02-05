import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, FC, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {destroyCookie, setCookie} from 'nookies'

interface IUser extends User {
    role: string;
}

interface IAuthentication {
    user: IUser | null,
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

const AuthProvider: FC = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [role, setRole] = useState<string>('');

    useEffect(()=> {
        const unsubscribe = onAuthStateChanged(authentication, (user) => {
            const res = user as IUser;
            setUser(res != null ? res : null);
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

            const ref = doc(database, 'users', res.uid);
            const snap = await getDoc(ref);

            if(!snap.exists()) {
                res.role = 'none';
                await setDoc(doc(database, 'users', res.uid), {
                    displayName: res.displayName,
                    email: res.email,
                    phoneNumber: res.phoneNumber,
                    photoURL: res.photoURL,
                    providerId: res.providerId,
                    role: res.role,
                    createdAt: serverTimestamp()
                  });
            }
            res.role = snap.get('role');
            setRole(snap.get('role'));
            setUser(res);
            setCookie(null, 'upsa.role', snap.get('role'), {
                maxAge: 30 * 24 * 60 * 60,
            })
        } catch (error) {
            console.error(error);
        }
    }

    const logout = async () => {
        try {
            await signOut(authentication).then(r => {
                destroyCookie(null, 'upsa.role')
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
