export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[] | string> | null;
  status?: number;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
