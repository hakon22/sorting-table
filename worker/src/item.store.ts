import { isEmpty, isNil } from 'lodash-es';
import { Singleton } from 'typescript-ioc';

import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '@shared/dto/common/pagination.dto';
import { AppHttpError } from '@shared/errors/app-http.error';

import type { PaginatedResultInterface } from '@shared/dto/common/paginated-result.dto';
import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';

@Singleton
export class ItemStore {
  // виртуальный диапазон, лимон по ТЗ
  private readonly baseMax = 1000000;

  private readonly extraIds = new Set<number>();

  private readonly selectedSet = new Set<number>();

  private selectedOrder: number[] = [];

  /**
   * ID уже есть в виртуальном диапазоне или extras
   */
  private exists = (id: number): boolean => {
    if (id >= 1 && id <= this.baseMax) {
      return true;
    }
    return this.extraIds.has(id);
  };

  private matchesSearch = (id: number, search?: string): boolean => {
    if (isNil(search) || isEmpty(search.trim())) {
      return true;
    }
    return String(id).includes(search.trim());
  };

  /**
   * Все ID по возрастанию: extras < 1, затем 1..1e6, затем extras > 1e6.
   * Миллион не храним: числа 1…baseMax считаются в цикле.
   */
  private *iterateUniverse(): Generator<number> {
    const extras = [...this.extraIds].sort((a, b) => a - b);
    let extraIndex = 0;

    while (extraIndex < extras.length && extras[extraIndex] < 1) {
      yield extras[extraIndex];
      extraIndex += 1;
    }

    for (let id = 1; id <= this.baseMax; id += 1) {
      yield id;
    }

    while (extraIndex < extras.length) {
      yield extras[extraIndex];
      extraIndex += 1;
    }
  }

  private toPage = (
    ids: number[],
    count: number,
    limit: number,
    offset: number,
  ): PaginatedResultInterface<ItemFindInterface> => {
    return {
      items: ids.map(id => ({
        id,
      })),
      count,
      limit,
      offset,
    };
  };

  /**
   * Добавляет ID вне уже существующего набора
   * @param id - любое целое
   */
  public addOne = (id: number) => {
    if (this.exists(id)) {
      throw new AppHttpError(400, `Элемент с ID ${id} уже есть`);
    }
    this.extraIds.add(id);
  };

  /**
   * Левый список
   */
  public getAvailable = (search?: string, offset = DEFAULT_OFFSET, limit = DEFAULT_LIMIT) => {
    this.ensureSelectionInvariant();
    const pageOffset = offset ?? DEFAULT_OFFSET;
    const pageLimit = limit ?? DEFAULT_LIMIT;
    const ids: number[] = [];
    let skipped = 0;
    const hasSearch = !(isNil(search) || isEmpty(search.trim()));

    if (!hasSearch) {
      const count = this.baseMax + this.extraIds.size - this.selectedSet.size;
      for (const id of this.iterateUniverse()) {
        if (this.selectedSet.has(id)) {
          continue;
        }
        if (skipped < pageOffset) {
          skipped += 1;
          continue;
        }
        ids.push(id);
        if (ids.length >= pageLimit) {
          break;
        }
      }
      return this.toPage(ids, count, pageLimit, pageOffset);
    }

    let count = 0;
    for (const id of this.iterateUniverse()) {
      if (this.selectedSet.has(id)) {
        continue;
      }
      if (!this.matchesSearch(id, search)) {
        continue;
      }
      count += 1;
      if (skipped < pageOffset) {
        skipped += 1;
        continue;
      }
      if (ids.length < pageLimit) {
        ids.push(id);
      }
    }

    return this.toPage(ids, count, pageLimit, pageOffset);
  };

  /**
   * Правый список в пользовательском порядке
   */
  public getSelected = (search?: string, offset = DEFAULT_OFFSET, limit = DEFAULT_LIMIT) => {
    this.ensureSelectionInvariant();
    const pageOffset = offset ?? DEFAULT_OFFSET;
    const pageLimit = limit ?? DEFAULT_LIMIT;
    const filtered = this.selectedOrder.filter(id => this.matchesSearch(id, search));

    return this.toPage(
      filtered.slice(pageOffset, pageOffset + pageLimit),
      filtered.length,
      pageLimit,
      pageOffset,
    );
  };

  /**
   * selectedSet и selectedOrder всегда про одно и то же множество ID
   */
  private ensureSelectionInvariant = () => {
    this.selectedOrder = this.selectedOrder.filter(id => this.selectedSet.has(id));
    const inOrder = new Set(this.selectedOrder);
    this.selectedSet.forEach(id => {
      if (!inOrder.has(id)) {
        this.selectedOrder.push(id);
      }
    });
  };

  /**
   * Выбрать элемент и поставить его в конец правого списка. Если он уже выбран, ничего не меняется.
   */
  public selectOne = (id: number) => {
    if (!this.exists(id)) {
      throw new AppHttpError(400, `Элемент с ID ${id} не найден`);
    }
    this.selectedSet.add(id);
    this.ensureSelectionInvariant();
  };

  /**
   * Убрать из выбранных. Повторный unselect — если элемент не выбран, ничего не меняется.
   */
  public unselectOne = (id: number) => {
    this.selectedSet.delete(id);
    this.ensureSelectionInvariant();
  };

  /**
   * arrayMove: activeId занимает слот overId в полном selectedOrder (в т.ч. под фильтром)
   */
  public reorder = (activeId: number, overId: number) => {
    const from = this.selectedOrder.indexOf(activeId);
    const to = this.selectedOrder.indexOf(overId);

    if (from < 0 || to < 0) {
      throw new AppHttpError(400, 'Нельзя переместить: ID нет в выбранных');
    }
    if (from === to) {
      return;
    }

    const next = [...this.selectedOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    this.selectedOrder = next;
  };
}
