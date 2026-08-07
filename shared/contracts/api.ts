export interface ApiSuccess<TData> {
  success: true;
  data: TData;
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
}

export type ApiEnvelope<TData> = ApiSuccess<TData> | ApiError;

export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
