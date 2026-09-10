import { Dto } from '@shared/dto/dto.class';
import { queryIntegerSchema } from '@shared/dto/schemas/query-integer.schema';

/** Тело выбора / снятия выбора */
export interface ItemIdInterface {
  /** Идентификатор элемента */
  id: number;
}

/**
 * DTO операции с одним ID
 */
export const ItemIdDto = Dto.create<ItemIdInterface>({
  id: {
    label: 'ID',
    positive: false,
    schema: queryIntegerSchema,
  },
});
