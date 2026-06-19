import type { TripDay } from './types';

/**
 * Shared, pure helpers for deriving display data from trip segments/days.
 * Used by the trip view, the day page, and the activity page so date formatting
 * and day labels stay consistent across the navigation chain.
 */

/** Long Hebrew date, e.g. "יום חמישי, 20 במרץ". */
export function formatTripDate(date: string): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

/**
 * A day's "name" — the city is the most meaningful day-level label in this
 * dataset. Returns '' when no city is set.
 */
export function getDayTitle(day: TripDay): string {
  return day.segments[0]?.city?.trim() || '';
}

/** The hotel for the day, if any. */
export function getDayHotel(day: TripDay): string {
  return day.segments[0]?.hotelsDetails?.trim() || '';
}

/**
 * A very short description for a day card — the first activity's summary.
 * Returned as raw HTML (summaries are stored as HTML); render it with
 * dangerouslySetInnerHTML and clamp it visually.
 */
export function getDayShortDescription(day: TripDay): string {
  return day.segments.find((s) => s.summary?.trim())?.summary?.trim() || '';
}
