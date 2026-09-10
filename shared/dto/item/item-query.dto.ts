import { PaginationDto, type PaginationQueryInterface } from '@shared/dto/common/pagination.dto';
import { SearchDto, type SearchQueryInterface } from '@shared/dto/common/search.dto';
import { Dto } from '@shared/dto/dto.class';

/** Query-параметры элементов */
export type ItemQueryInterface = SearchQueryInterface & PaginationQueryInterface;

/**
 * Общий DTO запроса элементов
 */
export const ItemQueryDto = Dto.union<ItemQueryInterface>(SearchDto, PaginationDto);
