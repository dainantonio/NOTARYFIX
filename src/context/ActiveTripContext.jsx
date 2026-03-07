// src/context/ActiveTripContext.jsx
// Global GPS + active trip state — persists across all page navigations.
//
// Start: DepartureChecklistModal auto-starts after checklist confirm (immediate, no page visit required)
//        OR from the Mileage page Start button
// Stop:  Floating banner Stop button → navigate to /mileage
//        ArriveMode "Stop & Log" button
//        Mileage page Stop button

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Haversine distance (miles) ───────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GPS Tracker Hook ─────────────────────────────────────────────────────────
// status: 'idle' | 'acquiring' | 'active' | 'denied' | 'unavailable'
function useGPSTracker() {
  const [status,    setStatus]    = useState('idle');
  const [liveMiles, setLiveMiles] = useState(0);
  const watchIdRef    = useRef(null);
  const lastPosRef    = useRef(null);
  const totalMilesRef = useRef(0);

  const start = useCallback(() => {
    if (!navigator?.geolocation) { setStatus('unavailable'); return; }
    setStatus('acquiring');
    setLiveMiles(0);
    totalMilesRef.current = 0;
    lastPosRef.current    = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus('active');
        const { latitude: lat, longitude: lon } = pos.coords;
        if (lastPosRef.current) {
          const d = haversine(lastPosRef.current.lat, lastPosRef.current.lon, lat, lon);
          if (d > 0.0095) { // filter jitter < ~50 ft
            totalMilesRef.current += d;
            setLiveMiles(Math.round(totalMilesRef.current * 10) / 10);
            lastPosRef.current = { lat, lon };
          }
        } else {
          lastPosRef.current = { lat, lon };
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  // Returns final miles total and fully resets the tracker
  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const miles = Math.round(totalMilesRef.current * 10) / 10;
    setStatus('idle');
    setLiveMiles(0);
    totalMilesRef.current = 0;
    lastPosRef.current    = null;
    return miles;
  }, []);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  return { status, liveMiles, start, stop };
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ActiveTripContext = createContext(null);

export function ActiveTripProvider({ children }) {
  const gps = useGPSTracker();
  const [liveTrip, setLiveTrip] = useState(null);
  const startedRef = useRef(false);

  // On mount: check for a pending trip queued by DepartureChecklistModal
  // This is the fallback path (page refresh). Normally DepartureChecklistModal
  // calls startTrip() directly via this context.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const raw = localStorage.getItem('notaryfix_pending_trip');
      if (!raw) return;
      const pending = JSON.parse(raw);
      localStorage.removeItem('notaryfix_pending_trip');
      setLiveTrip({
        origin:         pending.origin         || 'Home',
        destination:    pending.destination    || '',
        linkedJobId:    pending.linkedJobId    || null,
        linkedJobLabel: pending.linkedJobLabel || '',
        purpose:        pending.purpose        || 'Business',
        startTime:      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        startedAt:      Date.now(),
      });
      gps.start();
    } catch (e) { /* storage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // startTrip — called directly by DepartureChecklistModal or Mileage page
  const startTrip = useCallback((info) => {
    setLiveTrip({
      ...info,
      startTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      startedAt: Date.now(),
    });
    gps.start();
  }, [gps]);

  // stopAndGetMiles — stops GPS and returns the final mileage.
  // Caller must call clearTrip() after the user confirms saving.
  const stopAndGetMiles = useCallback(() => gps.stop(), [gps]);

  // clearTrip — call after saving the trip to the mileage log
  const clearTrip = useCallback(() => setLiveTrip(null), []);

  return (
    <ActiveTripContext.Provider value={{
      liveTrip,
      gpsStatus:      gps.status,
      liveMiles:      gps.liveMiles,
      startTrip,
      stopAndGetMiles,
      clearTrip,
    }}>
      {children}
    </ActiveTripContext.Provider>
  );
}

export function useActiveTrip() {
  const ctx = useContext(ActiveTripContext);
  if (!ctx) throw new Error('useActiveTrip must be used within ActiveTripProvider');
  return ctx;
}
