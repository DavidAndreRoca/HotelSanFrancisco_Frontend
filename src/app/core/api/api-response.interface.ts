export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  /** Código de negocio del backend (ej. EMAIL_NOT_VERIFIED, BUSINESS_ERROR, VALIDATION_ERROR). */
  code?: string | null;
  message: string;
  errors?: Record<string, string[] | string> | null;
  /** Errores por campo en validaciones @Valid (code === "VALIDATION_ERROR"). */
  fieldErrors?: Record<string, string> | null;
  path?: string | null;
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
