import { FindAllResponse } from 'src/base/types/common.type';
import { PipelineStage, PopulateOptions } from 'mongoose';
import { PaginationResult } from 'src/base/response/pagination.result';

export abstract class IBaseRepository<T> {
  abstract create(dto: T | any): Promise<T>;
  abstract findOneById(id: string, projection?: string): Promise<T>;
  abstract findOneByCondition(
    condition?: object,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<T>;
  abstract findByCondition(
    condition?: object,
    populate?: PopulateOptions | PopulateOptions[],
    pagination?: {
      limit: number;
      page: number;
      sort?: {
        [x: string]: 1 | -1;
      };
    },
  ): Promise<PaginationResult<T>>;
  abstract findOneWithRelative(
    condition?: object,
    aggregateProps?: PipelineStage[],
  ): Promise<T>;
  abstract getPagination(
    condition: object,
    options?: object,
    aggregateProps?: PipelineStage[],
  ): Promise<PaginationResult<T>>;
  abstract findAll(
    condition: object,
    options?: object,
  ): Promise<FindAllResponse<T>>;
  abstract findOneAndUpdate(condition: object, dto: Partial<T>): Promise<T>;
  abstract findAndUpdates(condition: object, dto: Partial<T>): Promise<any>;
  abstract updateById(id: string, dto: Partial<T>): Promise<T>;
  abstract update(condition: Record<string, any>, dto: Partial<T>): Promise<T>;
  abstract softDelete(id: string): Promise<boolean>;
  abstract permanentlyDelete(id: string): Promise<boolean>;
  abstract permanentlyDeleteMany(condition: object): Promise<boolean>;
  abstract insertMany(items: (T | any)[]): Promise<T[]>;
  abstract count(condition: object): Promise<number>;
}
