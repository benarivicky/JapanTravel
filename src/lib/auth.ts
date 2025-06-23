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
    
    console.log("Login successful with Firebase");

    // For this specific app, we'll hardcode the tripId for the test user
    // In a real app, this would likely come from a database (e.g., Firestore)
    // linked to the user's UID.
    if (user.email && user.email.toLowerCase() === 'test@example.com') {
      return { success: true, tripId: 'TRIP_123' };
    }

    // For any other user, we could potentially use their UID as a tripId
    // but the mock data only supports TRIP_123.
    return { success: true, tripId: user.uid };

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
