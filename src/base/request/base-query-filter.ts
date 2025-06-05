import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface IBaseQueryFilter {
  page: number;
  limit: number;
  orderBy?: string;
  orderByQueryClause: any;
  condition?: Record<string, unknown>;
  get orderByKey(): string | undefined;
  get orderType(): 'asc' | 'desc';
}

export class BaseQueryFilter implements IBaseQueryFilter {
  @ApiProperty({
    minimum: 0,
    maximum: 10000,
    title: 'Page',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 1,
  })
  page: number;

  @ApiProperty({
    minimum: 0,
    maximum: 10000,
    title: 'Limit',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 5,
  })
  limit: number;

  @ApiPropertyOptional({
    name: 'orderBy',
    description: `fieldName:asc || desc \r\n
    Supports only one at the once time`,
  })
  orderBy?: string;
  condition?: any = {};

  get orderByKey(): string | undefined {
    return this._orderByQueryClause?.orderBy;
  }
  get orderType(): 'asc' | 'desc' {
    return this._orderByQueryClause?.orderType;
  }

  private _customOrderByQuery?: any;

  get orderByQueryClause(): any | undefined {
    return (
      this._customOrderByQuery ??
      (this.orderByKey
        ? {
            [this.orderByKey as any]: this.orderType,
          }
        : undefined)
    );
  }

  set orderByQueryClause(value: any) {
    this._customOrderByQuery = value;
  }

  private get _orderByQueryClause() {
    return this._orderByQueryParameterToQuery(this.orderBy);
  }

  private _orderByQueryParameterToQuery(source?: string | null) {
    if (!source) return undefined;

    const [field, order] = source.split(':');
    return { orderBy: field, orderType: order as any };
  }
}
