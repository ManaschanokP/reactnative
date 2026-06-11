import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import { getQueue, removeFromQueue } from '../utils/offlineQueue';
import {
  startLocationTracking,
  stopLocationTracking,
} from './locationService';

let isSyncing = false;

export const syncQueue = async (): Promise<void> => {
  if (isSyncing) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.log('📴 Offline — skip sync');
    return;
  }

  const queue = await getQueue();
  if (queue.length === 0 &&
    !(await AsyncStorage.getItem('pending_tracking_start')) &&
    !(await AsyncStorage.getItem('pending_tracking_stop'))
  ) return;

  console.log(`🔄 Syncing ${queue.length} items...`);
  isSyncing = true;

  // ── sync queue items ──
  for (const item of queue) {
    try {
      const response = await apiService.postForm<{ error: boolean; message: string }>(
        item.endpoint,
        item.params,
      );
      console.log(`✅ Synced ${item.id}:`, response.message);
      await removeFromQueue(item.id);
    } catch (err) {
      console.log(`❌ Failed to sync ${item.id}:`, err);
    }
  }

  // ✅ handle pending tracking start
  try {
    const pendingStart = await AsyncStorage.getItem('pending_tracking_start');
    if (pendingStart) {
      const { request_id, status_id, user_id } = JSON.parse(pendingStart);
      await startLocationTracking(request_id, status_id, user_id);
      await AsyncStorage.removeItem('pending_tracking_start');
      console.log('✅ Resumed pending tracking start');
    }
  } catch (e) {
    console.warn('pending_tracking_start error:', e);
  }

  // ✅ handle pending tracking stop
  try {
    const pendingStop = await AsyncStorage.getItem('pending_tracking_stop');
    if (pendingStop) {
      await stopLocationTracking();
      await AsyncStorage.removeItem('pending_tracking_stop');
      console.log('🛑 Executed pending tracking stop');
    }
  } catch (e) {
    console.warn('pending_tracking_stop error:', e);
  }

  isSyncing = false;
  console.log('✅ Sync complete');
};

export const startSyncListener = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('🌐 Online — starting sync');
      syncQueue();
    }
  });
  return unsubscribe;
};