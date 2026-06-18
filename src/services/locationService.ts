import Geolocation from '@react-native-community/geolocation';
import BackgroundActions from 'react-native-background-actions';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PermissionsAndroid, Platform} from 'react-native';
import {enqueueLocation, flushQueue} from './locationQueue';

const KEYS = {
  REQUEST_ID: 'track_request_id',
  STATUS_ID: 'track_status_id',
  USER_ID: 'track_user_id',
  LAT: 'track_lat',
  LONG: 'track_long',
  DIST: 'track_dist',
  ACTIVE: 'track_active',
};

// ── Helpers ──────────────────────────────────────────────

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const theta = lon1 - lon2;
  let dist =
    Math.sin((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos((theta * Math.PI) / 180);
  dist = Math.acos(Math.min(1, Math.max(-1, dist)));
  dist = ((dist * 180) / Math.PI) * 60 * 1.1515 * 1.609344;
  return dist;
};

const getDateTimeNow = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const getCurrentPositionAsync = (): Promise<{
  latitude: number;
  longitude: number;
}> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
    );
  });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Background Task ───────────────────────────────────────

const trackingTask = async (_taskData: any) => {
  let netInfoUnsubscribe: (() => void) | null = null;

  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) flushQueue();
  });

  while (BackgroundActions.isRunning()) {
    try {
      const requestId = await AsyncStorage.getItem(KEYS.REQUEST_ID);
      const statusId = await AsyncStorage.getItem(KEYS.STATUS_ID);
      const userId = await AsyncStorage.getItem(KEYS.USER_ID);

      if (!requestId || !statusId || !userId) {
        await sleep(10000);
        continue;
      }

      const {latitude, longitude} = await getCurrentPositionAsync();
      const latLastStr = await AsyncStorage.getItem(KEYS.LAT);
      const longLastStr = await AsyncStorage.getItem(KEYS.LONG);
      const distLastStr = await AsyncStorage.getItem(KEYS.DIST);
      const distLast = distLastStr ? parseFloat(distLastStr) : 0;
      const datetime_location = getDateTimeNow();

      let dist = distLast;

      if (distLast !== 0 && latLastStr && longLastStr) {
        const moved = calculateDistance(
          parseFloat(latLastStr),
          parseFloat(longLastStr),
          latitude,
          longitude,
        );
        if (moved > 0.1) {
          dist = distLast + moved;
          await AsyncStorage.multiSet([
            [KEYS.LAT, latitude.toString()],
            [KEYS.LONG, longitude.toString()],
            [KEYS.DIST, dist.toString()],
          ]);
          await enqueueLocation({
            request_id: requestId,
            user_id: userId,
            lat: latitude.toString(),
            long: longitude.toString(),
            distance: dist.toString(),
            status_id: statusId,
            datetime_location,
          });
          await flushQueue();
        }
      } else {
        dist = 0.00001;
        await AsyncStorage.multiSet([
          [KEYS.LAT, latitude.toString()],
          [KEYS.LONG, longitude.toString()],
          [KEYS.DIST, dist.toString()],
        ]);
        await enqueueLocation({
          request_id: requestId,
          user_id: userId,
          lat: latitude.toString(),
          long: longitude.toString(),
          distance: dist.toString(),
          status_id: statusId,
          datetime_location,
        });
        await flushQueue();
      }

      console.log(
        `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)} | ${dist.toFixed(
          3,
        )} km`,
      );
    } catch (e) {
      console.warn('Tracking loop error:', e);
    }

    await sleep(5000); // รอ 5 วิ แล้วจับตำแหน่งใหม่
  }

  if (netInfoUnsubscribe) netInfoUnsubscribe();
};

// ── Notification Config (แสดงบน status bar ตอน tracking) ──

const backgroundOptions = {
  taskName: 'LocationTracking',
  taskTitle: 'กำลังติดตามตำแหน่ง',
  taskDesc: 'แอปกำลังบันทึกเส้นทางการจัดส่ง',
  taskIcon: {name: 'ic_launcher', type: 'mipmap'},
  color: '#0066CC',
  linkingURI: 'myapp://tracking',
  foregroundServiceType: ['location'] as Array<'location'>, // ✅ Fix: ระบุ literal type แทน string[]
  parameters: {},
};

// ── Public API ────────────────────────────────────────────

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
  return true;
};

export const startLocationTracking = async (
  request_id: string,
  status_id: string,
  userId: string,
): Promise<boolean> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return false;

  const savedRequestId = await AsyncStorage.getItem(KEYS.REQUEST_ID);
  if (savedRequestId !== request_id) {
    await AsyncStorage.multiSet([
      [KEYS.REQUEST_ID, request_id],
      [KEYS.STATUS_ID, status_id],
      [KEYS.USER_ID, userId],
      [KEYS.LAT, ''],
      [KEYS.LONG, ''],
      [KEYS.DIST, '0'],
      [KEYS.ACTIVE, 'true'],
    ]);
  } else {
    await AsyncStorage.multiSet([
      [KEYS.STATUS_ID, status_id],
      [KEYS.ACTIVE, 'true'],
    ]);
  }

  if (!BackgroundActions.isRunning()) {
    await BackgroundActions.start(trackingTask, backgroundOptions);
  }

  console.log('✅ Tracking started');
  return true;
};

export const stopLocationTracking = async (): Promise<void> => {
  if (BackgroundActions.isRunning()) {
    await BackgroundActions.stop();
  }
  await flushQueue();
  await AsyncStorage.multiRemove(Object.values(KEYS));
  console.log('🛑 Tracking stopped');
};

export const isTrackingActive = async (): Promise<boolean> => {
  const active = await AsyncStorage.getItem(KEYS.ACTIVE);
  return active === 'true';
};

export const getTotalDistance = async (): Promise<number> => {
  const dist = await AsyncStorage.getItem(KEYS.DIST);
  return dist ? parseFloat(dist) : 0;
};
