import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ADMIN_EMAILS = ['benari_v@hotmail.com', 'tokyosz.sigal@gmail.com'];
const ADMIN_DEFAULT_TRIP_ID = '373';

export async function signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Authentication successful for user:", user.uid);

    // If the user is an admin, return the default admin trip ID immediately.
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      console.log(`Admin user ${user.email} logged in. Granting access with default Trip ID.`);
      return { success: true, tripId: ADMIN_DEFAULT_TRIP_ID };
    }

    // For non-admin users, fetch their Trip ID from Firestore 'Users' collection.
    const userDocRef = doc(db, 'Users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const tripId = userData.TripId || userData.tripId; // Handle both cases for safety.
      if (tripId) {
        return { success: true, tripId: tripId };
      } else {
        // User document exists but has no Trip ID.
        return { success: false, error: 'לא נמצא מזהה טיול עבור משתמש זה.' };
      }
    } else {
      // User document does not exist in Firestore.
      return { success: false, error: 'לא נמצאו נתוני משתמש.' };
    }

  } catch (error: any)
{
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
