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
      console.log('Document found in Firestore. Data:', tripDocSnap.data());
      const data = tripDocSnap.data();
      // Assuming segments are stored in an array field named 'segments'
      const segments = (data.segments as TripSegment[]) || [];
      console.log(`Successfully parsed ${segments.length} segments.`);
      return segments;
    } else {
      console.warn(`No document found in Firestore at path: trips/${tripId}`);
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
