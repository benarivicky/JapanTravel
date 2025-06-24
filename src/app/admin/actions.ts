'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function uploadTripPlan(jsonContent: string): Promise<{ success: boolean; message: string; tripId?: string }> {
  try {
    const data = JSON.parse(jsonContent);

    const tripId = data.TRIPID;

    if (!tripId || typeof tripId !== 'string') {
      throw new Error('File must be a JSON object with a "TRIPID" string field.');
    }

    const docRef = doc(db, 'tripPlans', tripId);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(docRef);
    }

    await setDoc(docRef, data);

    return {
      success: true,
      message: `Successfully uploaded trip plan.`,
      tripId: tripId,
    };
  } catch (error: any) {
    console.error('Error uploading trip plan:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON file. Please check the file format.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, message: `Upload failed: ${errorMessage}` };
  }
}
