'use client';

import { useState, useEffect, useCallback } from 'react';

const TRIP_ID_KEY = 'tripId';

export function useTripId() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedTripId = localStorage.getItem(TRIP_ID_KEY);
      if (storedTripId) {
        setTripId(storedTripId);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const saveTripId = useCallback((id: string) => {
    try {
        localStorage.setItem(TRIP_ID_KEY, id);
        setTripId(id);
    } catch (error) {
        console.error("Could not save to localStorage", error);
    }
  }, []);

  const clearTripId = useCallback(() => {
    try {
        localStorage.removeItem(TRIP_ID_KEY);
        setTripId(null);
    } catch (error) {
        console.error("Could not remove from localStorage", error);
    }
  }, []);


  return { tripId, saveTripId, clearTripId, loading };
}
