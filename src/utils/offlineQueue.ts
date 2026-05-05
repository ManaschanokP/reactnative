// app/src/utils/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

export type QueueItem = {
  id: string;
  endpoint: string;
  params: Record<string, string>;
  createdAt: string;
};

// เพิ่ม action เข้า queue
export const addToQueue = async (
  endpoint: string,
  params: Record<string, string>,
): Promise<void> => {
  const queue = await getQueue();
  const item: QueueItem = {
    id: Date.now().toString(),
    endpoint,
    params,
    createdAt: new Date().toISOString(),
  };
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log('📥 Added to offline queue:', item);
};

// ดึง queue ทั้งหมด
export const getQueue = async (): Promise<QueueItem[]> => {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// ลบ item ที่ sync แล้ว
export const removeFromQueue = async (id: string): Promise<void> => {
  const queue = await getQueue();
  const updated = queue.filter(item => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
};

// ล้าง queue ทั้งหมด
export const clearQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};