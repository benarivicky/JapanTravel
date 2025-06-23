import type { TripSegment } from './types';

const tripPlans: TripSegment[] = [
  {
    id: '1',
    tripId: '434',
    date: '2024-10-20',
    timeSegment: 'בוקר',
    timeSegmentNumeric: 1,
    summary: 'נחיתה בטוקיו והתמקמות',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">נחיתה והגעה למלון</h3><p class="text-right">לאחר נחיתה בשדה התעופה נריטה (NRT), ניקח את רכבת Narita Express למרכז טוקיו. משם, ניסע למלון שלנו באזור שינג'וקו להתארגנות קצרה ומנוחה.</p><p class="text-right mt-2"><b>מלון:</b> Park Hyatt Tokyo</p>`,
    linkTitle: 'אתר מלון Park Hyatt',
    linkLink: 'https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo/tyoph',
  },
  {
    id: '2',
    tripId: '434',
    date: '2024-10-20',
    timeSegment: 'צהריים',
    timeSegmentNumeric: 2,
    summary: 'שינג\'וקו גיוען וקניות',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">סיור בשינג'וקו</h3><p class="text-right">נבקר בפארק הלאומי שינג'וקו גיוען, אחד הפארקים הגדולים והיפים בטוקיו. לאחר מכן נצא לסיור קניות באזור התוסס של שינג'וקו, כולל ביקור בחנות הכלבו Isetan.</p>`,
  },
  {
    id: '3',
    tripId: '434',
    date: '2024-10-20',
    timeSegment: 'ערב',
    timeSegmentNumeric: 3,
    summary: 'ארוחת ערב ב-Omoide Yokocho',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">חוויה קולינרית אותנטית</h3><p class="text-right">לארוחת ערב נבקר ב-Omoide Yokocho (סמטת הזיכרונות), סמטה צרה מלאה בברי יאקיטורי קטנים ואווירה של פעם. נהנה משיפודים ובירה מקומית.</p>`,
  },
  {
    id: '4',
    tripId: '434',
    date: '2024-10-21',
    timeSegment: 'בוקר',
    timeSegmentNumeric: 1,
    summary: 'מקדש מייג\'י והראג\'וקו',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">תרבות וצעירים</h3><p class="text-right">נתחיל את הבוקר בביקור במקדש מייג'י השליו, המוקדש לקיסר מייג'י ורעייתו. לאחר מכן, נצלול לאווירה הצבעונית והתוססת של רחוב טקשיטה בהראג'וקו, מרכז תרבות הפופ והאופנה של צעירי טוקיו.</p>`,
  },
  {
    id: '5',
    tripId: '434',
    date: '2024-10-21',
    timeSegment: 'צהריים',
    timeSegmentNumeric: 2,
    summary: 'שיבויה - המעבר העמוס בעולם',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">חציית שיבויה</h3><p class="text-right">נמשיך לאזור שיבויה, שם נחווה את מעבר החצייה המפורסם, העמוס ביותר בעולם. נעלה לקומת התצפית בבניין Shibuya Sky לתצפית פנורמית על העיר. נבקר גם בפסל המפורסם של הכלב האצ'יקו.</p>`,
    linkTitle: 'מידע על Shibuya Sky',
    linkLink: 'https://www.shibuya-scramble-square.com/sky/',
  },
  {
    id: '6',
    tripId: '434',
    date: '2024-10-21',
    timeSegment: 'ערב',
    timeSegmentNumeric: 3,
    summary: 'ארוחת ערב ובילוי בשיבויה',
    detailedContent: `<h3 class="text-xl font-bold mb-2 text-right">סושי וקניות</h3><p class="text-right">נאכל ארוחת ערב באחת ממסעדות הסושי המעולות בשיבויה, ולאחר מכן נחקור את חנויות הבוטיק והברים הרבים באזור.</p>`,
  }
];


export async function getTripPlans(tripId: string): Promise<TripSegment[]> {
  console.log(`Fetching trip plans from mock data for tripId: ${tripId}`);
  // For this demo app, we'll always return the same trip plan.
  return Promise.resolve(tripPlans);
}

export async function getTripSegment(tripId: string, date: string, segmentNumeric: number): Promise<TripSegment | undefined> {
    console.log(`Fetching segment from mock data for tripId: ${tripId}, date: ${date}, segment: ${segmentNumeric}`);
    const segments = await getTripPlans(tripId);
    return segments.find(segment => segment.date === date && segment.timeSegmentNumeric === segmentNumeric);
}
