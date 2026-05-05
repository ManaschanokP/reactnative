// app/src/services/syncService.ts
import NetInfo from '@react-native-community/netinfo';
import apiService from './apiService';
import { getQueue, removeFromQueue } from '../utils/offlineQueue';

let isSyncing = false;

export const syncQueue = async (): Promise<void> => {
  if (isSyncing) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.log('📴 Offline — skip sync');
    return;
  }

  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`🔄 Syncing ${queue.length} items...`);
  isSyncing = true;

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
      // ไม่ลบออก — รอ sync ครั้งหน้า
    }
  }

  isSyncing = false;
  console.log('✅ Sync complete');
};

// เริ่ม listener — sync อัตโนมัติเมื่อ online
export const startSyncListener = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('🌐 Online — starting sync');
      syncQueue();
    }
  });
  return unsubscribe; // return ไว้ unsubscribe ตอน cleanup
};