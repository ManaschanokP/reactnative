// app/src/hooks/useLocationTracking.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  startLocationTracking,
  stopLocationTracking,
} from '../services/locationService';

export const useLocationTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  // ✅ เช็คว่ากำลัง track อยู่ไหมตอนเปิด app
  useEffect(() => {
    const checkTracking = async () => {
      const requestId = await AsyncStorage.getItem('track_request_id');
      const dist = await AsyncStorage.getItem('track_dist');
      if (requestId) {
        setIsTracking(true);
        setTotalDistance(parseFloat(dist ?? '0'));
      }
    };
    checkTracking();

    // อัปเดต distance ทุก 5 วิ
    const interval = setInterval(async () => {
      const dist = await AsyncStorage.getItem('track_dist');
      if (dist) setTotalDistance(parseFloat(dist));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const start = async (request_id: string, status_id: string, userId: string) => {
    await startLocationTracking(request_id, status_id, userId);
    setIsTracking(true);
  };

  const stop = async () => {
    await stopLocationTracking();
    setIsTracking(false);
    setTotalDistance(0);
  };

  return { isTracking, totalDistance, start, stop };
};