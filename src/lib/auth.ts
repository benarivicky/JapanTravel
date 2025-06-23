import { auth } from './firebase';
import { 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';

export async function signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
  console.log(`Attempting login for email: ${email}`);
  
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Login successful with Firebase for user:", user.uid);

    // For this demo app, we'll always return the same tripId since we are using mock data.
    // In a real app, this would come from a database.
    return { success: true, tripId: '434' };

  } catch (error) {
    console.error("Firebase login failed", error);
    let errorMessage = 'אירעה שגיאה לא צפויה.';
    // This is the correct way to check for Firebase Auth errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const authError = error as { code: string };
        switch (authError.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                 errorMessage = 'אימייל או סיסמה שגויים';
                 break;
            case 'auth/invalid-email':
                errorMessage = 'כתובת אימייל לא תקינה.';
                break;
            default:
                errorMessage = 'שגיאת התחברות. נסה שוב מאוחר יותר.';
                break;
        }
    }
    return { success: false, error: errorMessage };
  }
}
