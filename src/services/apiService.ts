// app/src/services/apiService.ts
import axios from 'axios';
import qs from 'qs';
import {API_ENDPOINTS, getBaseUrlByCompany} from '../config/apiConfig';
import {
  LoginRequest,
  LoginResponse,
  UpdateTokenRequest,
  UpdateTokenResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../types/authTypes';
import { 
  JobRequest, 
  JobResponse ,
  ListStatusRequest,
  ListStatusResponse,
  UpdateStatusRequest,
  UpdateStatusResponse,
} from '../types/jobTypes';
import { NotificationRequest, NotificationResponse  } from '../types/NotificationTypes';


/* CALL API URL OLD Pattern
const api = await axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
*/

const apiService = {
  get: async <T>(url: string, params?: object): Promise<T> => {
    try {
      const baseURL = await getBaseUrlByCompany();
      const fullURL = baseURL + url;
      console.log('📡 GET URL:', fullURL);
      const response = await axios.get<T>(baseURL + url, {params});
      return response.data;
    } catch (error) {
      console.error('GET Error:', error);
      throw error;
    }
  },

  post: async <T>(url: string, data?: object): Promise<T> => {
    try {
      const baseURL = await getBaseUrlByCompany();
      const fullURL = baseURL + url;
      console.log('📡 POST URL:', fullURL);
      const response = await axios.post<T>(baseURL + url, data, {
        headers: {'Content-Type': 'application/json'},
      });
      return response.data;
    } catch (error) {
      console.error('POST Error:', error);
      throw error;
    }
  },

  postForm: async <T>(url: string, data: object): Promise<T> => {
    try {
      const baseURL = await getBaseUrlByCompany();
      const fullURL = baseURL + url;
      console.log('📡 POST FORM URL:', fullURL);
      const response = await axios.post<T>(
        baseURL + url,
        qs.stringify(data), // Convert JSON to form-urlencoded format
        {
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        },
      );

      if (typeof response.data === 'string' && response.data.includes('Fatal error')) {
      throw new Error('Server error: PHP Fatal error');
    }

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  postFormLogin: async <T>(url: string, data: object): Promise<T> => {
    try {
      const baseURL = await getBaseUrlByCompany();
      const fullURL = baseURL + url;
      console.log('📡 GET URL:', fullURL);
      const response = await axios.post<T>(
        baseURL + url,
        qs.stringify(data), // Convert JSON to form-urlencoded format
        {
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        },
      );
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};



export const loginUser = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  /* FOR TESTING ONLY
  if (process.env.NODE_ENV === 'development') {
      if (credentials.username === 'admin' && credentials.password === 'admin') {
          return new Promise((resolve) => setTimeout(() => resolve(DUMMY_USER), 1000));
      } else if (credentials.username === 'driver' && credentials.password === 'driver') {
        DUMMY_USER.User[0].name = 'Driver Doe';
        DUMMY_USER.User[0].status = 'U04'; // Driver
        return new Promise((resolve) => setTimeout(() => resolve(DUMMY_USER), 1000));
      } else if (credentials.username === 'msg' && credentials.password === 'msg') {
        DUMMY_USER.User[0].name = 'Messenger Doe';
        DUMMY_USER.User[0].status = 'U05'; // Messenger
        return new Promise((resolve) => setTimeout(() => resolve(DUMMY_USER), 1000));
      } else {
        console.log('Using dummy login user in development mode');
        return new Promise((resolve) => setTimeout(() => resolve(DUMMY_USER_FAIL), 1000));
      }
  }
  console.log('API_ENDPOINTS.LOGIN:', API_ENDPOINTS.LOGIN);
  */
  return apiService.postFormLogin<LoginResponse>(
    API_ENDPOINTS.CHECK_COMPANY,
    credentials,
  );
};

export const checkLogin = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  return apiService.postForm<LoginResponse>(
    API_ENDPOINTS.CHECK_LOGIN,
    credentials,
  );
};

export const updateToken = async (
  dataUpdateToken: UpdateTokenRequest,
): Promise<UpdateTokenResponse> => {
  return apiService.postForm<UpdateTokenResponse>(
    API_ENDPOINTS.UPDATE_TOKEN,
    dataUpdateToken,
  );
};

export const updateUser = async (
  dataUpdateUser: UpdateUserRequest,
): Promise<UpdateUserResponse> => {
  return apiService.postForm<UpdateUserResponse>(
    API_ENDPOINTS.UPDATE_PROFILE,
    dataUpdateUser,
  );
};

export const getNotifications = async (
  params: NotificationRequest,
): Promise<NotificationResponse> => {
  return apiService.postForm<NotificationResponse>(
    API_ENDPOINTS.NOTIFICATION,
    params,
  );
};

export const getMyJobs = async (
  params: JobRequest,
): Promise<JobResponse> => {
  return apiService.postForm<JobResponse>(
    API_ENDPOINTS.GET_MY_JOBS,
    params,
  );
};
export const getListStatus = async (
  params: ListStatusRequest,
): Promise<ListStatusResponse> => {
  return apiService.postForm<ListStatusResponse>(
    API_ENDPOINTS.LIST_STATUS,
    params,
  );
};

export const updateStatus = async (
  params: UpdateStatusRequest,
): Promise<UpdateStatusResponse> => {
  return apiService.postForm<UpdateStatusResponse>(
    API_ENDPOINTS.UPDATE_STATUS,
    params,
  );
};
export type UpdatePictureRequest = {
  request_id: string;
  status_id: string;
  detail: string;
  picture: string; // base64
  box: string;
  user_status: string;
  mile: string;
  driver: string;
};

export const updatePicture = async (
  params: UpdatePictureRequest,
): Promise<UpdateStatusResponse> => {
  return apiService.postForm<UpdateStatusResponse>(
    API_ENDPOINTS.UPDATE_PICTURE,
    params,
  );
};

export default apiService;
