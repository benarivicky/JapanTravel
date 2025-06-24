import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
  console.log(`Attempting login for email: ${email}`);
  
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Authentication successful for user:", user.uid);

    const userDocRef = doc(db, 'Users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const tripId = userData.tripId;
      if (tripId) {
        return { success: true, tripId: tripId };
      } else {
        return { success: false, error: 'Trip ID not found for this user.' };
      }
    } else {
      if (email === 'benari_v@hotmail.com' || email === 'tokyosz.sigal@gmail.com') {
          return { success: true, tripId: '434' };
      }
      return { success: false, error: 'User data not found.' };
    }

  } catch (error: any) {
    console.error("Firebase sign-in failed:", error);
    let errorMessage = 'אירעה שגיאה לא צפויה.';
    if (error.code) {
        switch (error.code) {
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
