import { apiClient } from '@web/shared/api/api-client';

import type { PaginatedResultInterface } from '@shared/dto/common/paginated-result.dto';
import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';
import type { ItemFormInterface } from '@shared/dto/item/item-form.dto';
import type { ItemIdInterface } from '@shared/dto/item/item-id.dto';
import type { ItemQueryInterface } from '@shared/dto/item/item-query.dto';
import type { ItemReorderInterface } from '@shared/dto/item/item-reorder.dto';

export const fetchAvailableItems = async (params: ItemQueryInterface, signal?: AbortSignal) => {
  const { data } = await apiClient.get<PaginatedResultInterface<ItemFindInterface>>('/items/available', {
    params,
    signal,
  });
  return data;
};

export const fetchSelectedItems = async (params: ItemQueryInterface, signal?: AbortSignal) => {
  const { data } = await apiClient.get<PaginatedResultInterface<ItemFindInterface>>('/items/selected', {
    params,
    signal,
  });
  return data;
};

export const addItem = async (body: ItemFormInterface) => {
  const { data } = await apiClient.post<ItemFindInterface>('/items', body);
  return data;
};

export const selectItem = async (body: ItemIdInterface) => {
  const { data } = await apiClient.post<ItemFindInterface>('/items/select', body);
  return data;
};

export const unselectItem = async (body: ItemIdInterface) => {
  const { data } = await apiClient.post<ItemFindInterface>('/items/unselect', body);
  return data;
};

export const reorderItems = async (body: ItemReorderInterface) => {
  const { data } = await apiClient.post<ItemReorderInterface>('/items/reorder', body);
  return data;
};
