//Inside the AuthContext file.

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';

// Inside AuthProvider
const provider = new GoogleAuthProvider();

const login = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log({ credential, token, user });
        })
        .catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log({ errorCode, errorMessage, email, credential });
        });
};

const logout = () => {
    auth.signOut();
    console.log("logout");
};



// import { useState, useEffect } from 'react';
// import Firebase from '../services/firebase';

// interface UserInterface {
//   uid: string;
//   email: string;
// }

// const formatAuthUser = (user: UserInterface) => ({
//   uid: user.uid,
//   email: user.email
// });

// export default function useFirebaseAuth() {
//   const [authUser, setAuthUser] = useState<UserInterface | null>(null);
//   const [loading, setLoading] = useState(true);

//   const authStateChanged = async (authState: UserInterface) => {
//     if (!authState) {
//       setAuthUser(null);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     var formattedUser = formatAuthUser(authState);
//     setAuthUser(formattedUser);
//     setLoading(false);
//   };

// // listen for Firebase state change
//   useEffect(() => {
//      const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged);
//     return () => unsubscribe();
//   }, []);

//   return {
//     authUser,
//     loading
//   };
// }
