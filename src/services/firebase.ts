import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from "firebase/auth";
import 'firebase/auth';
import 'firebase/firestore'; // If you need it
// import 'firebase/storage' // If you need it
// import 'firebase/analytics' // If you need it
// import 'firebase/performance' // If you need it

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // storageBucket: "storageBucket",
    // messagingSenderId: "messagingSenderID",
    // appId: "appID",
    // measurementId: "measurementID",
};

if (!getApps().length) {
    initializeApp(firebaseConfig);
}

export const auth = getAuth();

export default firebaseConfig;
