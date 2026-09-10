import { Dto } from '@shared/dto/dto.class';
import { queryIntegerSchema } from '@shared/dto/schemas/query-integer.schema';

/** Элемент в ответе API */
export interface ItemFindInterface {
  /** Идентификатор */
  id: number;
}

/**
 * DTO строки списка
 */
export const ItemFindDto = Dto.create<ItemFindInterface>({
  id: {
    label: 'ID',
    positive: false,
    schema: queryIntegerSchema,
  },
});
