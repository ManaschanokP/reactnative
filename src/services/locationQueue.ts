// app/src/services/locationQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getBaseUrlByCompany, API_ENDPOINTS } from '../config/apiConfig';

export interface LocationRecord {
  id: string;
  request_id: string;
  user_id: string;
  lat: string;
  long: string;
  distance: string;
  status_id: string;
  datetime_location: string;
}

const QUEUE_KEY = 'location_queue';

// ✅ เพิ่ม record ลง queue
export const enqueueLocation = async (
  record: Omit<LocationRecord, 'id'>,
): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: LocationRecord[] = raw ? JSON.parse(raw) : [];

    const newRecord: LocationRecord = {
      ...record,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    queue.push(newRecord);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`📦 Queued [${newRecord.id}] | queue size: ${queue.length}`);
  } catch (e) {
    console.error('enqueueLocation error:', e);
  }
};

// ✅ ดึง queue ทั้งหมด
export const getQueue = async (): Promise<LocationRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('getQueue error:', e);
    return [];
  }
};

// ✅ ลบ record ออกจาก queue หลังส่งสำเร็จ
export const dequeueLocation = async (id: string): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: LocationRecord[] = raw ? JSON.parse(raw) : [];
    const updated = queue.filter(r => r.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('dequeueLocation error:', e);
  }
};

// ✅ ส่ง record เดียวไป API
const sendRecord = async (record: LocationRecord): Promise<boolean> => {
  try {
    const baseUrl = await getBaseUrlByCompany();
    const url = `${baseUrl}${API_ENDPOINTS.DISTANCE}`;

    const formData = new FormData();
    formData.append('request_id',        record.request_id);
    formData.append('user_id',           record.user_id);
    formData.append('lat',               record.lat);
    formData.append('long',              record.long);
    formData.append('distance',          record.distance);
    formData.append('status_id',         record.status_id);
    formData.append('datetime_location', record.datetime_location);

    const res  = await fetch(url, { method: 'POST', body: formData });
    const json = await res.json();
    console.log(`✅ Sent [${record.id}] dist=${record.distance}:`, json.message ?? json);
    return true;
  } catch (e) {
    console.error(`❌ Failed to send [${record.id}]:`, e);
    return false;
  }
};

// ✅ Flush queue ทั้งหมดตามลำดับ
export const flushQueue = async (): Promise<void> => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const queue = await getQueue();
      console.log(`📵 No internet — ${queue.length} records waiting in queue`);
      return;
    }

    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`📤 Flushing ${queue.length} queued locations...`);

    for (const record of queue) {
      const success = await sendRecord(record);
      if (success) {
        await dequeueLocation(record.id);
      } else {
        // ถ้าส่งไม่สำเร็จ หยุด flush รอรอบถัดไป
        console.log('⚠️ Flush stopped — will retry when online');
        break;
      }
    }

    const remaining = await getQueue();
    console.log(`📦 Queue remaining: ${remaining.length}`);
  } catch (e) {
    console.error('flushQueue error:', e);
  }
};

// ✅ ล้าง queue ทั้งหมด (ใช้ตอน stop tracking)
export const clearQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(QUEUE_KEY);
  console.log('🗑 Location queue cleared');
};

// ✅ ดูจำนวน record ที่รออยู่
export const getQueueSize = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};