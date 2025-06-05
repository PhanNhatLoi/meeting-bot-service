import { IsOptional } from 'class-validator';
import { BaseQueryFilter } from 'src/base/request/base-query-filter';

export class FilterMeetDto extends BaseQueryFilter {
  @IsOptional()
  keyword?: string;
}
