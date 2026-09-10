import { Dto } from '@shared/dto/dto.class';
import { queryIntegerSchema } from '@shared/dto/schemas/query-integer.schema';

/** {@link PaginationQueryInterface.limit} по умолчанию */
export const DEFAULT_LIMIT = 20;

/** {@link PaginationQueryInterface.offset} по умолчанию */
export const DEFAULT_OFFSET = 0;

/** Максимальный {@link PaginationQueryInterface.limit} */
export const MAX_PAGINATION_LIMIT = 100;

/** Query-параметры пагинации */
export interface PaginationQueryInterface {
  /** Сколько записей взять ({@link DEFAULT_LIMIT} по умолчанию) */
  limit?: number;
  /** Сколько записей пропустить ({@link DEFAULT_OFFSET} по умолчанию) */
  offset?: number;
}

/**
 * Общий DTO пагинации (query)
 */
export const PaginationDto = Dto.create<PaginationQueryInterface>({
  limit: {
    label: 'Отобрать элементов',
    optional: true,
    schema: queryIntegerSchema
      .min(1)
      .default(DEFAULT_LIMIT)
      .max(MAX_PAGINATION_LIMIT),
  },
  offset: {
    label: 'Пропустить элементов',
    optional: true,
    positive: false,
    schema: queryIntegerSchema
      .min(0)
      .default(DEFAULT_OFFSET),
  },
});
