import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TripSegment } from './types';

export async function getTripPlans(tripId: string): Promise<TripSegment[]> {
  console.log(`Fetching trip plans from Firestore for tripId: ${tripId}`);
  if (!tripId) {
    console.error('No tripId provided to getTripPlans');
    return [];
  }

  try {
    const tripDocRef = doc(db, 'trips', tripId);
    const tripDocSnap = await getDoc(tripDocRef);

    if (tripDocSnap.exists()) {
      const tripData = tripDocSnap.data();
      console.log('Trip data found in Firestore:', tripData);
      
      const segments = tripData.segments as TripSegment[];
      if (Array.isArray(segments)) {
        return segments;
      } else {
        console.error("Firestore document exists, but 'segments' field is not an array or is missing.");
        return [];
      }
    } else {
      console.log(`No such document in Firestore! Path: trips/${tripId}`);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trip plans from Firestore:', error);
    return [];
  }
}

export async function getTripSegment(
  tripId: string,
  date: string,
  segmentNumeric: number
): Promise<TripSegment | undefined> {
  console.log(
    `Fetching segment from Firestore data for tripId: ${tripId}, date: ${date}, segment: ${segmentNumeric}`
  );
  const segments = await getTripPlans(tripId);
  return segments.find(
    (segment) =>
      segment.date === date && segment.timeSegmentNumeric === segmentNumeric
  );
}
