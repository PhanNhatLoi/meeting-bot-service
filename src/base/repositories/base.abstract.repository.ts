import { BaseEntity } from 'src/base/entities/base-entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';
import {
  FilterQuery,
  Model,
  PipelineStage,
  PopulateOptions,
  QueryOptions,
} from 'mongoose';
import { FindAllResponse } from 'src/base/types/common.type';
import { PaginationResult } from 'src/base/response/pagination.result';
import { SortOrder } from 'src/shared/enum';
import { GoneException } from '@nestjs/common';
import { Results } from '../response/result-builder';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';

export abstract class BaseRepositoryAbstract<T extends BaseEntity>
  implements IBaseRepository<T>
{
  protected constructor(private readonly model: Model<T>) {
    this.model = model;
  }

  async create(dto: T | any): Promise<T> {
    const created_data = await this.model.create(dto);
    return created_data.save() as any;
  }

  async findOneById(
    id: string,
    projection?: string,
    options?: QueryOptions<T>,
  ): Promise<T> {
    const item = await this.model.findById(id, projection, options);
    return item?.deletedAt ? null : item;
  }

  async findOneByCondition(
    condition = {},
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<T> {
    return await this.model
      .findOne({
        ...condition,
      })
      .populate(populate)
      .exec();
  }

  async findByCondition(
    condition = {},
    populate?: PopulateOptions | PopulateOptions[],
    pagination?: {
      limit: number;
      page: number;
      sort?: {
        [x: string]: 1 | -1;
      };
    },
  ): Promise<PaginationResult<T>> {
    pagination.limit = Number(pagination.limit) || 10;
    pagination.page = Number(pagination.page) || 1;
    pagination.sort = pagination.sort || { _id: -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const count = await this.model
      .find({
        ...condition,
      })
      .populate(populate)
      .countDocuments();

    const data = await this.model
      .find({
        ...condition,
      })
      .populate(populate)
      .limit(pagination?.limit)
      .sort(pagination?.sort || { _id: -1 })
      .skip(skip)
      .exec();

    const totalPage = Math.ceil(count / pagination?.limit);
    return {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        pageCount: totalPage,
      },
      data: data,
    };
  }

  async findOneWithRelative(
    condition = {},
    aggregateProps: PipelineStage[] = [],
  ): Promise<T> {
    const result = await this.model
      .aggregate([
        {
          $match: {
            ...condition,
          },
        },
        ...aggregateProps,
      ])
      .exec();
    if (result.length && result[0]?.deletedAt) {
      throw new GoneException(
        Results.goneException(
          'Data is deleted',
          ERRORS_DICTIONARY.DATA_DELETED,
        ),
      );
    }
    return (result.length && result[0]) || null;
  }

  async getPagination(
    condition: FilterQuery<T>,
    options?: QueryOptions<T>,
    aggregateProps: PipelineStage[] = [],
  ): Promise<PaginationResult<T>> {
    options.page = Number(options.page) || 1;
    options.limit = Number(options.limit) || 10;
    options.skip = ((options.page || 1) - 1) * (options.limit || 10);

    let sorted: any = {};
    if (options.orderBy) {
      const orderBys: any[] = options.orderBy.split('|');
      orderBys.map((orderBy) => {
        const order = orderBy.split(',');
        if (
          order.length === 2 &&
          Object.keys(SortOrder).includes(
            order[1]?.toUpperCase() as keyof typeof SortOrder,
          )
        ) {
          sorted[order[0]] =
            order[1].toUpperCase() === SortOrder.ASC.toUpperCase() ? 1 : -1;
        }
      });
    } else {
      sorted._id = 1;
    }

    const [data, count] = await Promise.all([
      this.model
        .aggregate([
          {
            $match: { ...condition, deletedAt: null },
          },
          ...aggregateProps,
          { $sort: sorted },
          { $skip: options.skip },
          { $limit: options.limit },
        ])
        .sort(sorted),
      this.model
        .aggregate([
          {
            $match: { ...condition, deletedAt: null },
          },
          ...aggregateProps,
        ])
        .exec()
        .then((res) => res.length || 0),
    ]);

    const totalPage = Math.ceil(count / (options?.limit || 0));
    const pagination = {
      page: options.page,
      limit: options.limit,
      total: count,
      pageCount: totalPage,
    };

    return {
      data,
      pagination,
    };
  }

  async findAll(
    condition: FilterQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<FindAllResponse<T>> {
    const [count, data] = await Promise.all([
      this.model.countDocuments({ ...condition, deletedAt: null }),
      this.model.find(
        { ...condition, deletedAt: null },
        options?.projection,
        options,
      ),
    ]);

    return {
      count,
      data,
    };
  }

  async findOneAndUpdate(condition: object, dto: Partial<T>): Promise<T> {
    return await this.model.findOneAndUpdate(
      { ...condition, deletedAt: null },
      dto,
      { new: true, upsert: true },
    );
  }

  async findAndUpdates(condition: object, dto: Partial<T>): Promise<any> {
    return await this.model.updateMany({ ...condition, deletedAt: null }, dto, {
      new: true,
      upsert: true,
    });
  }

  async update(condition: Record<string, any>, dto: Partial<T>): Promise<T> {
    const conditionWithDeletedAt = { ...condition, deletedAt: null };
    const updatedDocument = await this.model.findOneAndUpdate(
      conditionWithDeletedAt,
      dto,
      { new: true },
    );

    return updatedDocument || null;
  }

  async updateById(id: string, dto: Partial<T>): Promise<T> {
    const updatedDocument = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: null },
      dto,
      { new: true },
    );

    return updatedDocument || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const delete_item = await this.model.findById(id);
    if (!delete_item) {
      return false;
    }

    return !!(await this.model
      .findByIdAndUpdate<T>(id, {
        deletedAt: new Date(),
      })
      .exec());
  }

  async permanentlyDelete(id: string): Promise<boolean> {
    const delete_item = await this.model.findById(id);
    if (!delete_item) {
      return false;
    }
    return !!(await this.model.findByIdAndDelete(id));
  }

  async permanentlyDeleteMany(condition: object): Promise<boolean> {
    await this.model.deleteMany(condition);
    return true;
  }

  async insertMany(items: T[]): Promise<T[]> {
    return (await this.model.insertMany(items)) as any;
  }

  async count(condition: object): Promise<number> {
    return await this.model.countDocuments(condition);
  }
}
