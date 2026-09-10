import { Dto } from '@shared/dto/dto.class';
import { queryIntegerSchema } from '@shared/dto/schemas/query-integer.schema';

/** Перестановка выбранных (в т.ч. в отфильтрованном списке) */
export interface ItemReorderInterface {
  /** Что перетаскиваем */
  activeId: number;
  /** Слот dnd-kit arrayMove: activeId занимает позицию overId */
  overId: number;
}

/**
 * DTO drag&drop
 */
export const ItemReorderDto = Dto.create<ItemReorderInterface>({
  activeId: {
    label: 'Перемещаемый ID',
    positive: false,
    schema: queryIntegerSchema,
  },
  overId: {
    label: 'Целевой ID',
    positive: false,
    schema: queryIntegerSchema,
  },
});
