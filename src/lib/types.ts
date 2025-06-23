export interface ExternalLink {
  linkTitle?: string;
  linkLink?: string;
}

export interface TripSegment {
  id: string;
  tripId: string;
  date: string; // "YYYY-MM-DD"
  timeSegment: string; // e.g., "בוקר", "צהריים", "ערב"
  timeSegmentNumeric: number; // for sorting
  summary: string;
  detailedContent: string; // HTML content
  externalLinks?: ExternalLink[];
}

export interface TripDay {
  date: string;
  segments: TripSegment[];
}
