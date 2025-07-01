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
    const tripDocRef = doc(db, 'tripPlans', tripId);
    const tripDocSnap = await getDoc(tripDocRef);

    if (tripDocSnap.exists()) {
      const tripData = tripDocSnap.data();
      console.log('Trip data found in Firestore:', tripData);
      
      const dailyItinerary = tripData.dailyItinerary || tripData.dailyitinerary;
      if (!Array.isArray(dailyItinerary)) {
        throw new Error("נתוני הטיול אינם תקינים: שדה 'dailyItinerary' חסר או אינו מערך.");
      }

      const allSegments: TripSegment[] = [];

      dailyItinerary.forEach((day: any) => {
        const date = day.Date || day.date;
        const city = day.City || day.city;
        const hotelsDetails = day.HotelsDetails || day.hotelsDetails;

        if (day.activities && Array.isArray(day.activities) && date) {
          day.activities.forEach((activity: any) => {
            const externalLinks = (activity.externalLinks || []).map((link: any) => ({
              linkTitle: link.LinkTitle || link.linkTitle,
              linkLink: link.LinkLink || link.linkLink,
            })).filter((link: any) => link.linkLink && link.linkTitle);

            const segment: TripSegment = {
              id: `${date}-${activity.timeSegmentNumeric}`,
              tripId: tripId,
              date: date,
              city: city,
              hotelsDetails: hotelsDetails,
              timeSegment: activity.timeSegment || 'פעילות',
              timeSegmentNumeric: activity.timeSegmentNumeric || 0,
              summary: activity.summary || `פעילות ב${city || 'מיקום לא ידוע'}`,
              detailedContent: activity.detailedContent || '<p>אין פירוט זמין.</p>',
              externalLinks: externalLinks.length > 0 ? externalLinks : undefined,
            };
            allSegments.push(segment);
          });
        }
      });

      console.log('Transformed segments:', allSegments);
      return allSegments;

    } else {
      console.log(`No such document in Firestore! Path: tripPlans/${tripId}`);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trip plans from Firestore:', error);
    throw error;
  }
}

export async function getTripCustomerName(tripId: string): Promise<string | null> {
  if (!tripId) {
    console.error('No tripId provided to getTripCustomerName');
    return null;
  }
  try {
    const tripDocRef = doc(db, 'tripPlans', tripId);
    const tripDocSnap = await getDoc(tripDocRef);
    if (tripDocSnap.exists()) {
      const tripData = tripDocSnap.data();
      const customerName = tripData['Customer name'] || tripData.customerName || tripData.CustomerName;
      if (typeof customerName === 'string' && customerName.trim() !== '') {
        return customerName;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer name from Firestore:', error);
    return null;
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
