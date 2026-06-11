'use server';

import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const mainApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(mainApp);


// The schema and validation are now handled on the client-side page component.
// This function receives the validated data.
export async function createNewUser(values: { email: string; password: string; TripId: string; }): Promise<{ success: boolean; message: string }> {
  
  const { email, password, TripId } = values;

  // Use a temporary app to create the user without affecting the admin's session.
  const tempAppName = `temp-user-creation-${Date.now()}`;
  let tempApp;
  try {
    tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    const user = userCredential.user;
    
    // Step 2: Create user document in Firestore 'Users' collection.
    await setDoc(doc(db, 'Users', user.uid), {
      email: user.email,
      TripId: TripId,
    });

    return { success: true, message: `Successfully created user ${email} with Trip ID ${TripId}.` };

  } catch (error: any) {
    console.error('Error creating new user:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use by another account.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. It must be at least 6 characters.';
          break;
        default:
          errorMessage = `Failed to create user: ${error.message}`;
          break;
      }
    }
    return { success: false, message: errorMessage };
  } finally {
    // Step 3: Clean up (delete) the temporary app instance
    if (tempApp) {
      await deleteApp(tempApp);
    }
  }
}
