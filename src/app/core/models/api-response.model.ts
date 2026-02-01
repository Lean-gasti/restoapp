export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  companyId: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface SetNewPasswordRequest {
  token: string;
  newPassword: string;
}
