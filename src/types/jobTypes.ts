export type JobItem = {
  request_id: string;
  type_name: string;
  to_company: string;
  d_date: string;
  d_time: string;
  status_name: string;
  status_id: string;
  box: string;
};

export type JobResponse = {
  error: boolean;
  message?: string;
  MyJobs: JobItem[];
};

export type JobRequest = {
  driver: string;
  start: string;
  end: string;
  status: string;
};
export type StatusItem = {
  status_name: string;
};

export type ListStatusResponse = {
  error: boolean;
  message?: string;
  listStatus: StatusItem[];
};

export type ListStatusRequest = {
  request_id: string;
  status_now: string;
  type_user: string;
};

export type UpdateStatusRequest = {
  request_id: string;
  status_id: string;
  detail: string;
  box: string;
  user_status: string;
  mile: string;
  driver: string;
};

export type UpdateStatusResponse = {
  error: boolean;
  message: string;
};