import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, FC, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";

interface IUser extends User {
    role: string;
}

interface IAuthentication {
    user: IUser | null,
    login: () => void,
    logout: () => void,
    role: () => Promise<string>,
};

const authentication = auth;
const database = db;

const AuthContext = createContext<IAuthentication>({
    user: null,
    login: async () => {},
    logout: () => {},
    role: async () => new Promise<string>(()=> 'zz'),
});

const AuthProvider: FC = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [roleProfile, setRoleProfile] = useState<string>('xx');

    useEffect(()=> {
        const unsubscribe = onAuthStateChanged(authentication, (user) => {
            const res = user as IUser;
            // if(res) {
            //     getDoc(doc(database, 'users', res.uid)).then( (snap) =>{
            //         res.role = snap.get('role');
            //     });
            // }
            setUser(res != null ? res : null);
        });

        return unsubscribe;
    }, []);

//     useEffect(() => {
// console.log('passo 3');
//             if(user) {
// console.log('passo 4');
//                 const ref = doc(database, 'users', user.uid);
//                 getDoc(ref).then((snap) => {
//                     setRoleProfile(snap.get('role'))
//                 });
//             }
//     }, [roleProfile]);

    const login = async () => {
        try {
            const { user } = await signInWithPopup(authentication, new GoogleAuthProvider());
            const res = user as IUser;

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
            setRoleProfile(snap.get('role'));
            setUser(res);
        } catch (error) {
            console.error(error);
        }
    }

    const logout = async () => {
        try {
            await signOut(authentication);
        } catch (error) {
            console.error(error);
        }
    }

    const role = async () => {
        try {
console.log('passo 1');
            if(user) {
console.log('passo 2');
                const ref = doc(database, 'users', user.uid);
                getDoc(ref).then((snap) => {
                    setRoleProfile(snap.get('role'));
                    return snap.get('role');
                });
            }
            return roleProfile;
        } catch (error) {
            console.error(error);
            return '';
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, role }}>
            { children }
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
