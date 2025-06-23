export interface TripSegment {
  id: string;
  tripId: string;
  date: string; // "YYYY-MM-DD"
  timeSegment: string; // e.g., "בוקר", "צהריים", "ערב"
  timeSegmentNumeric: number; // 1, 2, 3 for sorting
  summary: string;
  detailedContent: string; // HTML content
  linkTitle?: string;
  linkLink?: string;
}

export interface TripDay {
  date: string;
  segments: TripSegment[];
}
