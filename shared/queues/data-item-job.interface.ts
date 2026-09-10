import type { ItemQueryInterface } from '@shared/dto/item/item-query.dto';

/** Действие в очереди DATA_ITEMS */
export enum DataJobActionEnum {
  /** Чтение доступных элементов */
  GET_AVAILABLE = 'GET_AVAILABLE',
  /** Чтение выбранных элементов */
  GET_SELECTED = 'GET_SELECTED',
  /** Выбор элемента */
  SELECT = 'SELECT',
  /** Снятие выбора с элемента */
  UNSELECT = 'UNSELECT',
  /** Перестановка выбранных: arrayMove в слот overId (в т.ч. в отфильтрованном списке) */
  REORDER = 'REORDER',
}

/** Джоба чтения / изменения выбора и порядка */
export interface DataItemJobInterface extends ItemQueryInterface {
  /** Действие */
  action: DataJobActionEnum;
  /** Идентификатор элемента */
  id?: number;
  /** Перемещаемый ID */
  activeId?: number;
  /** Целевой ID */
  overId?: number;
}
