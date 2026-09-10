import * as yup from 'yup';

import { Dto } from '@shared/dto/dto.class';

/** Общий query-параметр текстового поиска */
export interface SearchQueryInterface {
  /** Строка поиска */
  search?: string;
}

/**
 * Общий DTO текстового поиска (query)
 */
export const SearchDto = Dto.create<SearchQueryInterface>({
  search: {
    label: 'Поиск',
    optional: true,
    schema: yup.string(),
  },
});
