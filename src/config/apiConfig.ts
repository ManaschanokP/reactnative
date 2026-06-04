//app/src/config/apiConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = {
  ALL_DEV: 'https://isl.dev.thaigl.com/SmartLogisticsTIND/Api/v2/?op=',
  TND_DEV: 'https://isl.dev.thaigl.com/SmartLogisticsTIND/Api/v1/?op=',
  TGL_DEV: 'https://isl.dev.thaigl.com/logistics/Api/v1/?op=',
 // ALL: 'http://www.i-smartlogistics.com/SmartLogisticsTIND/Api/v2/?op=',
 // TND: 'http://www.i-smartlogistics.com/SmartLogisticsTIND/Api/v1/?op=',
 // TGL: 'http://www.i-smartlogistics.com/logistics/Api/v1/?op=',
  ALL: 'http://172.16.1.230/SmartLogisticsTIND/Api/v2/?op=',
  TND: 'http://172.16.1.230/SmartLogisticsTIND/Api/v2/?op=',
  TGL: 'http://172.16.1.230/logistics/Api/v1/?op=',
};

//export const API_URL = API_BASE_URL[ENV as keyof typeof API_BASE_URL];
export const getBaseUrlByCompany = async (): Promise<string> => {
  const companyCode = await AsyncStorage.getItem('companyCode');
  console.log(companyCode);
  switch (companyCode) {
    case 'TND':
      return API_BASE_URL.TND;
    case 'TGL':
      return API_BASE_URL.TGL;
    default:
      return API_BASE_URL.ALL;
  }
};

export const API_ENDPOINTS = {
  CHECK_COMPANY: 'CheckCompanyLogin',
  CHECK_LOGIN: 'CheckLogin',
  GET_MY_JOBS: 'getMyJobs',
  UPDATE_PROFILE: 'UpdateUser',
  LIST_STATUS: 'listStatus',
  TRACK: 'Track',
  UPDATE_STATUS: 'UpdateStatus',
  UPDATE_PICTURE: 'UpdatePicture',
  SIGNATURE: 'Signature',
  EVALUATION: 'Evaluation',
  GET_STATUS_NOW: 'getStatusNow',
  GET_MY_REQUEST_DRIVER: 'MyrequestDriver',
  GET_MY_REQUEST_MESSENGER: 'MyrequestMessenger',
  FUEL: 'Fuel',
  LIST_LICENSE: 'listlicense',
  DISTANCE: 'Distance',
  NOTIFICATION: 'Notification',
  CONFIRM: 'Confirm',
  UPDATE_TOKEN: 'Updatetoken',
  DETAIL_NOTIFICATION: 'DetailNotification',
  DETAIL_NOTIFICATION_SPECIAL: 'DetailNotificationSpecial',
  ACCEPT: 'Accept',
};
