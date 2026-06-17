// type ร่วมสำหรับ list/pagination ทุก repo
export interface PageQuery {
  page: number; // 1-based
  pageSize: number;
  search?: string;
  status?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/** normalize query → ค่าใช้งานจริง (offset/limit) */
export function toOffsetLimit(q: PageQuery): { offset: number; limit: number } {
  const page = Math.max(1, q.page || 1);
  const limit = Math.max(1, Math.min(100, q.pageSize || DEFAULT_PAGE_SIZE));
  return { offset: (page - 1) * limit, limit };
}
