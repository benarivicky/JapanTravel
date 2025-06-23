import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TripSegment } from './types';

const getTimeSegment = (index: number): { name: string; numeric: number } => {
    const segments = [
        { name: 'בוקר', numeric: 1 },
        { name: 'צהריים', numeric: 2 },
        { name: 'ערב', numeric: 3 },
    ];
    if (index < segments.length) {
        return segments[index];
    }
    return { name: `פעילות ${index + 1}`, numeric: index + 1 };
};

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
      
      const dailyItinerary = tripData.dailyItinerary;
      if (!Array.isArray(dailyItinerary)) {
        throw new Error("נתוני הטיול אינם תקינים: שדה 'dailyItinerary' חסר או אינו מערך.");
      }

      const allSegments: TripSegment[] = [];

      dailyItinerary.forEach((day: any) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity: any, index: number) => {
            const timeSegment = getTimeSegment(index);
            
            let linkTitle: string | undefined = undefined;
            let linkLink: string | undefined = undefined;

            if (activity.externalLinks && Array.isArray(activity.externalLinks) && activity.externalLinks.length > 0) {
              const firstLink = activity.externalLinks[0];
              if (firstLink && typeof firstLink === 'object') {
                linkTitle = firstLink.title || firstLink.name;
                linkLink = firstLink.link || firstLink.url;
              }
            }

            const segment: TripSegment = {
              id: `${day.Date}-${index}`,
              tripId: tripId,
              date: day.Date,
              timeSegment: timeSegment.name,
              timeSegmentNumeric: timeSegment.numeric,
              summary: `${timeSegment.name} ב${day.City || 'מיקום לא ידוע'}`,
              detailedContent: activity.detailedContent || '<p>אין פירוט זמין.</p>',
              linkTitle: linkTitle,
              linkLink: linkLink,
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
