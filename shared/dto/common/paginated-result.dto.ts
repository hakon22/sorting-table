/**
 * Ответ спискового API с пагинацией
 */
export interface PaginatedResultInterface<T> {
  /** Элементы текущей страницы */
  items: T[];
  /** Общее число записей (с учётом фильтров, без limit/offset) */
  count: number;
  /** Сколько записей запрошено */
  limit: number;
  /** Сколько записей пропущено */
  offset: number;
}
