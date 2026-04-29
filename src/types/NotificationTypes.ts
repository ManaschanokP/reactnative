export type NotificationItem = {
  request_id: string;
  status_name: string;
  t_com: string;
  d_date: string;
  d_time: string;
  remake: string;
};

export type NotificationResponse = {
  error: boolean;
  message?: string;
  Notification: NotificationItem[]; // ✅ ตรงกับ response จริง
};

export type NotificationRequest = {
  user_status: string; // ✅ ตรงกับ params ใน Kotlin
  requester: string;
  page: string;
};