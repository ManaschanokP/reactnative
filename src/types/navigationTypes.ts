//app/src/types/navigationTypes.ts
import {JobItem} from './jobTypes';

export type RootStackParamList = {
  Login: undefined;
  Profile: undefined;
  Home: undefined;
  Menu: undefined;
  FuelEntry: undefined;
  Satisfaction: undefined;
  NotificationList: undefined;
  NotificationDetail: undefined;
  JobList: undefined;
  ViewDetail: {item: JobItem; fromScreen?: string};
  Scan: undefined; //เพิ่มไปหน้าสแกน
  Tracking: {requestId: string};
  Signature: {request_id: string; status_id: string};
  Evaluation: {request_id: string; status_id: string};
};
