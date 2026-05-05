// app/src/services/locationService.ts
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueLocation, flushQueue } from './locationQueue';

const KEYS = {
  REQUEST_ID: 'track_request_id',
  STATUS_ID:  'track_status_id',
  USER_ID:    'track_user_id',
  LAT:        'track_lat',
  LONG:       'track_long',
  DIST:       'track_dist',
  ACTIVE:     'track_active',
  WATCHER_ID: 'track_watcher_id',
};

// ✅ ตรงกับ distance() ใน Kotlin
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number => {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const theta = lon1 - lon2;
  let dist =
    Math.sin((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos((theta * Math.PI) / 180);
  dist = Math.acos(Math.min(1, Math.max(-1, dist)));
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515 * 1.609344;
  return dist;
};

const getDateTimeNow = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

// watcherId เก็บไว้เพื่อ clearWatch ตอน stop
let watcherId: number | null = null;
// NetInfo unsubscribe
let netInfoUnsubscribe: (() => void) | null = null;

// ✅ ขอ permission GPS (Android)
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'ขอสิทธิ์ใช้ GPS',
        message: 'แอปต้องการตำแหน่งเพื่อติดตามการจัดส่ง',
        buttonPositive: 'อนุญาต',
        buttonNegative: 'ปฏิเสธ',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS จัดการ permission ผ่าน Info.plist
};

// ✅ handle ทุก location update — ตรงกับ onLocationResult ใน Kotlin
const handleLocationUpdate = async (position: GeoPosition) => {
  const { latitude, longitude } = position.coords;

  const requestId   = await AsyncStorage.getItem(KEYS.REQUEST_ID);
  const statusId    = await AsyncStorage.getItem(KEYS.STATUS_ID);
  const userId      = await AsyncStorage.getItem(KEYS.USER_ID);
  const latLastStr  = await AsyncStorage.getItem(KEYS.LAT);
  const longLastStr = await AsyncStorage.getItem(KEYS.LONG);
  const distLastStr = await AsyncStorage.getItem(KEYS.DIST);

  if (!requestId || !statusId || !userId) return;

  const distLast = distLastStr ? parseFloat(distLastStr) : 0;
  const datetime_location = getDateTimeNow();
  let dist = distLast;

  if (distLast !== 0 && latLastStr && longLastStr) {
    // ✅ ตรงกับ if (dist_last!=0.0) ใน Kotlin
    const moved = calculateDistance(
      parseFloat(latLastStr), parseFloat(longLastStr),
      latitude, longitude,
    );

    if (moved > 0.2) {
      // ✅ ตรงกับ if (dist>0.2) ใน Kotlin
      dist = distLast + moved;
      await AsyncStorage.setItem(KEYS.LAT,  latitude.toString());
      await AsyncStorage.setItem(KEYS.LONG, longitude.toString());
      await AsyncStorage.setItem(KEYS.DIST, dist.toString());

      await enqueueLocation({
        request_id: requestId,
        user_id:    userId,
        lat:        latitude.toString(),
        long:       longitude.toString(),
        distance:   dist.toString(),
        status_id:  statusId,
        datetime_location,
      });

      await flushQueue();
    }
  } else {
    // ✅ ตรงกับ else (ครั้งแรก) ใน Kotlin
    dist = 0.00001;
    await AsyncStorage.setItem(KEYS.LAT,  latitude.toString());
    await AsyncStorage.setItem(KEYS.LONG, longitude.toString());
    await AsyncStorage.setItem(KEYS.DIST, dist.toString());

    await enqueueLocation({
      request_id: requestId,
      user_id:    userId,
      lat:        latitude.toString(),
      long:       longitude.toString(),
      distance:   dist.toString(),
      status_id:  statusId,
      datetime_location,
    });

    await flushQueue();
  }

  console.log(`📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)} | ${dist.toFixed(3)} km`);
};

// ✅ เริ่ม tracking — ตรงกับ startLocationService() ใน Kotlin
export const startLocationTracking = async (
  request_id: string,
  status_id: string,
  userId: string,
): Promise<boolean> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('❌ Location permission denied');
    return false;
  }

  // รีเซ็ต state
  await AsyncStorage.multiSet([
    [KEYS.REQUEST_ID, request_id],
    [KEYS.STATUS_ID,  status_id],
    [KEYS.USER_ID,    userId],
    [KEYS.LAT,        ''],
    [KEYS.LONG,       ''],
    [KEYS.DIST,       '0'],
    [KEYS.ACTIVE,     'true'],
  ]);

  // ✅ watchPosition — ตรงกับ requestLocationUpdates interval=4000 ใน Kotlin
  watcherId = Geolocation.watchPosition(
    handleLocationUpdate,
    (error) => console.error('GPS error:', error),
    {
      enableHighAccuracy: true,
      distanceFilter:     50,   // เมตร — อัปเดตเมื่อขยับ 50m
      interval:           4000, // ✅ ตรงกับ interval = 4000 ใน Kotlin
      fastestInterval:    2000, // ✅ ตรงกับ fastestInterval = 2000 ใน Kotlin
      forceRequestLocation: true,
      showLocationDialog: true,
    },
  );

  console.log(`✅ Tracking started | watcherId: ${watcherId} | request: ${request_id}`);

  // ✅ listener เน็ตกลับมา → flush queue อัตโนมัติ
  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('🌐 Internet restored — flushing queue...');
      flushQueue();
    }
  });

  return true;
};

// ✅ หยุด tracking — ตรงกับ stopLocationService() ใน Kotlin
export const stopLocationTracking = async (): Promise<void> => {
  if (watcherId !== null) {
    Geolocation.clearWatch(watcherId);
    watcherId = null;
    console.log('🛑 GPS watcher cleared');
  }

  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }

  // ✅ Flush รอบสุดท้ายก่อนหยุด — ตรงกับ deleteAllLocationIT() ใน Kotlin
  await flushQueue();

  await AsyncStorage.multiRemove(Object.values(KEYS));
  console.log('🛑 Tracking stopped + final flush done');
};

export const isTrackingActive = async (): Promise<boolean> => {
  const active = await AsyncStorage.getItem(KEYS.ACTIVE);
  return active === 'true';
};

export const getTotalDistance = async (): Promise<number> => {
  const dist = await AsyncStorage.getItem(KEYS.DIST);
  return dist ? parseFloat(dist) : 0;
};