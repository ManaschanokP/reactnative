//app/src/types/navigationTypes.ts
import {JobItem} from './jobTypes';
import { NotificationItem } from './notificationTypes';

export type ViewDetailItem = {
  request_id: string;
  status_id: string;
  status_name: string;
  type_name: string;
  to_company: string;
  d_date: string;
  d_time: string;
  // field อื่นๆ ที่ JobItem มีและ NotificationDetail ไม่มี ให้ใส่ optional
  box?: string;
  pickup_date?: string;
  pickup_time?: string;
  license_no?: string;
};

export type RootStackParamList = {
  Login: undefined;
  Profile: undefined;
  Home: undefined;
  Menu: undefined;
  FuelEntry: undefined;
  Satisfaction: undefined;
  NotificationList: undefined;
  NotificationDetail: { item: NotificationItem };
  JobList: undefined;
  ViewDetail: {item: ViewDetailItem; fromScreen?: string};
  Scan: undefined; //เพิ่มไปหน้าสแกน
  Tracking: {requestId: string};
  Signature: {request_id: string; status_id: string};
  Evaluation: {request_id: string; status_id: string};
};
