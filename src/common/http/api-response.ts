export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    path?: string;
  };
};

export type ApiError = {
  success: false;
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
