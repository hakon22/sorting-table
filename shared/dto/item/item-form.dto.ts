import { Dto } from '@shared/dto/dto.class';
import { queryIntegerSchema } from '@shared/dto/schemas/query-integer.schema';

/** Тело добавления элемента */
export interface ItemFormInterface {
  /** Идентификатор (любое целое) */
  id: number;
}

/**
 * DTO создания элемента
 */
export const ItemFormDto = Dto.create<ItemFormInterface>({
  id: {
    label: 'ID',
    positive: false,
    schema: queryIntegerSchema,
  },
});
