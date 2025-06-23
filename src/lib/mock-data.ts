import type { TripSegment } from './types';

const allTripSegments: TripSegment[] = [
  {
    id: '1',
    tripId: 'TRIP_123',
    date: '2024-10-20',
    timeSegment: 'בוקר',
    timeSegmentNumeric: 1,
    summary: 'נחיתה בטוקיו והתמקמות',
    detailedContent: `
      <h3 class="text-xl font-bold mb-2 text-right">נחיתה והגעה למלון</h3>
      <p class="text-right">לאחר נחיתה בשדה התעופה נריטה (NRT), ניקח את רכבת Narita Express למרכז טוקיו. משם, ניסע למלון שלנו באזור שינג\'וקו להתארגנות קצרה ומנוחה.</p>
      <p class="text-right mt-2"><b>מלון:</b> Park Hyatt Tokyo</p>`,
    linkTitle: 'אתר מלון Park Hyatt',
    linkLink: 'https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo/tyoph',
  },
  {
    id: '2',
    tripId: 'TRIP_123',
    date: '2024-10-20',
    timeSegment: 'ערב',
    timeSegmentNumeric: 3,
    summary: 'ארוחת ערב וסיור לילי בשינג\'וקו',
    detailedContent: `
      <h3 class="text-xl font-bold mb-2 text-right">סיור לילי בשינג'וקו</h3>
      <p class="text-right">נצא לסיור רגלי באזור שינג\'וקו, נתרשם משלטי הניאון הבוהקים, נבקר בסמטת Omoide Yokocho לארוחת ערב של יאקיטורי ונסיים בתצפית מרהיבה על העיר מבניין הממשל המטרופוליני של טוקיו.</p>`,
  },
  {
    id: '3',
    tripId: 'TRIP_123',
    date: '2024-10-21',
    timeSegment: 'בוקר',
    timeSegmentNumeric: 1,
    summary: 'שוק הדגים טסוקיג\'י והמקדש הסמוך',
    detailedContent: `
      <h3 class="text-xl font-bold mb-2 text-right">שוק טסוקיג'י</h3>
      <p class="text-right">נבקר בשוק החיצוני של טסוקיג\'י, נטעם מאכלי ים טריים, סושי ואוכל רחוב יפני אותנטי. לאחר מכן, נבקר במקדש Tsukiji Hongan-ji הסמוך, בעל הארכיטקטורה הייחודית.</p>`,
  },
  {
    id: '4',
    tripId: 'TRIP_123',
    date: '2024-10-21',
    timeSegment: 'צהריים',
    timeSegmentNumeric: 2,
    summary: 'גני הארמון הקיסרי ושיבויה',
    detailedContent: `
      <h3 class="text-xl font-bold mb-2 text-right">הארמון הקיסרי ושיבויה</h3>
      <p class="text-right">ניסע לאזור הארמון הקיסרי של טוקיו ונבקר בגנים המזרחיים. לאחר מכן, ניסע לשיבויה, נחווה את מעבר החצייה המפורסם בעולם ונבקר בפסל של האצ\'יקו, הכלב הנאמן.</p>`,
    linkTitle: 'מידע על מעבר החצייה בשיבויה',
    linkLink: 'https://www.japan-guide.com/e/e3007.html',
  },
    {
    id: '5',
    tripId: 'TRIP_123',
    date: '2024-10-22',
    timeSegment: 'יום שלם',
    timeSegmentNumeric: 1,
    summary: 'טיול יום להאקונה',
    detailedContent: `
      <h3 class="text-xl font-bold mb-2 text-right">טיול יום להאקונה</h3>
      <p class="text-right">ניקח את רכבת השינקנסן להאקונה, אזור הררי יפהפה הידוע בנופי הר פוג\'י, אונסנים (מעיינות חמים) ומוזיאונים לאמנות. נשוט באגם אשי ונבקר במוזיאון הפתוח של האקונה.</p>`,
    linkTitle: 'מידע על האקונה',
    linkLink: 'https://www.japan-guide.com/e/e5200.html',
  },
];

export async function getTripPlans(tripId: string): Promise<TripSegment[]> {
  console.log(`Fetching trip plans for tripId: ${tripId}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return allTripSegments.filter(segment => segment.tripId === tripId);
}

export async function getTripSegment(date: string, segmentNumeric: number): Promise<TripSegment | undefined> {
    console.log(`Fetching segment for date: ${date}, segment: ${segmentNumeric}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return allTripSegments.find(segment => segment.date === date && segment.timeSegmentNumeric === segmentNumeric);
}
