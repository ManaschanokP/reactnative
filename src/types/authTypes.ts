//app/src/types/authTypes.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  error: boolean;
  User: User[];
  token?: string;
  message?: string;
}

export interface UpdateTokenRequest {
  token: string;
  id: string;
}

export interface UpdateTokenResponse {
  error: boolean;
  message: string;
}

export interface User {
  id: string;
  name: string;
  department: string;
  tel: string | null;
  phone: string;
  company: string;
  status: string;
  first_login: string;
}

export interface ProfileForm {
  id: string;
  name: string;
  department: string;
  tel: string;
  phone: string;
  company: string;
}

export interface UpdateUserRequest {
  username: string;
  name: string;
  department: string;
  tel: string;
  phone: string;
  company: string;
}

export interface UpdateUserResponse {
  error: boolean;
  message: string;
}
