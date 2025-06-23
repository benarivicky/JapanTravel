import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { TripSegment } from './types';

const TRIP_COLLECTION = 'trips';

export async function getTripPlans(tripId: string): Promise<TripSegment[]> {
  console.log(`Fetching trip plans from Firestore for tripId: ${tripId}`);
  try {
    const tripDocRef = doc(db, TRIP_COLLECTION, tripId);
    const tripDocSnap = await getDoc(tripDocRef);

    if (tripDocSnap.exists()) {
      const data = tripDocSnap.data();
      // Assuming segments are stored in an array field named 'segments'
      return (data.segments as TripSegment[]) || [];
    } else {
      console.log('No such trip document!');
      return [];
    }
  } catch (error) {
    console.error("Error fetching trip plans from Firestore:", error);
    return [];
  }
}

export async function getTripSegment(tripId: string, date: string, segmentNumeric: number): Promise<TripSegment | undefined> {
    console.log(`Fetching segment from Firestore for tripId: ${tripId}, date: ${date}, segment: ${segmentNumeric}`);
    const segments = await getTripPlans(tripId);
    return segments.find(segment => segment.date === date && segment.timeSegmentNumeric === segmentNumeric);
}
