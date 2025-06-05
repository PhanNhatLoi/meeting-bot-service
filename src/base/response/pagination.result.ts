export class PaginationResult<T> {
  data: T[];
  pagination: PaginationMetaData = new PaginationMetaData();
}

class PaginationMetaData {
  constructor() {
    this.page = 0;
    this.limit = 25;
    this.total = 0;
  }
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}
