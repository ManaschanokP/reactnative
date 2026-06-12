export type NotificationItem = {
  request_id: string;
  status_name: string;
  status_id: string;
  type_name: string;
  to_company: string;
  t_com: string;
  d_date: string;
  d_time: string;
  remake: string;
  pickup_date:string;
  pickup_time:string;
  license_no: string;
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