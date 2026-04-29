export type JobItem = {
  request_id: string;
  type_name: string;
  to_company: string;
  d_date: string;
  d_time: string;
  status_name: string;
  status_id: string;
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