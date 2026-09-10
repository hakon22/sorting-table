import { App } from 'antd';
import { useRef, useState } from 'react';

import { AddItemForm } from '@web/components/AddItemForm';
import { AVAILABLE_SCROLL_ID, AvailableList } from '@web/components/AvailableList';
import { SELECTED_SCROLL_ID, SelectedList } from '@web/components/SelectedList';
import { usePagedItems } from '@web/hooks/use-paged-items';
import {
  addItem,
  fetchAvailableItems,
  fetchSelectedItems,
  reorderItems,
  selectItem,
  unselectItem,
} from '@web/shared/api/item-api';
import { getApiErrorMessage, isAbortError } from '@web/shared/lib/get-api-error-message';

import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';

const moveByIds = (state: ItemFindInterface[], activeId: number, overId: number) => {
  const from = state.findIndex(({ id }) => id === activeId);
  const to = state.findIndex(({ id }) => id === overId);
  if (from < 0 || to < 0 || from === to) {
    return state;
  }
  const next = [...state];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const SortingBoard = () => {
  const { message } = App.useApp();
  const [addLoading, setAddLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const pendingIdsRef = useRef<number[]>([]);
  const mutationChainRef = useRef(Promise.resolve());

  const notifyError = (error: unknown, fallback: string) => {
    if (isAbortError(error)) {
      return;
    }
    const text = getApiErrorMessage(error, fallback);
    message.error(text);
  };

  const available = usePagedItems({
    fetchPage: fetchAvailableItems,
    scrollElementId: AVAILABLE_SCROLL_ID,
    onError: notifyError,
    errorFallback: 'Не удалось загрузить список',
  });

  const selected = usePagedItems({
    fetchPage: fetchSelectedItems,
    scrollElementId: SELECTED_SCROLL_ID,
    onError: notifyError,
    errorFallback: 'Не удалось загрузить выбранные',
  });

  const markPending = (ids: number[]) => {
    pendingIdsRef.current = [...new Set([...pendingIdsRef.current, ...ids])];
    setPendingIds(pendingIdsRef.current);
  };

  const clearPending = (ids: number[]) => {
    pendingIdsRef.current = pendingIdsRef.current.filter(id => !ids.includes(id));
    setPendingIds(pendingIdsRef.current);
  };

  /**
   * Быстрые клики уходят по одному: иначе SELECT разных ID в одном батче
   * могут прийти в другом порядке, и хвост правого списка перепутается
   */
  const runAfterPrevious = (task: () => Promise<void>) => {
    mutationChainRef.current = mutationChainRef.current
      .then(task)
      .catch(() => undefined);
  };

  const syncLists = async () => {
    await Promise.all([
      available.reloadLoaded({
        silent: true,
      }),
      selected.reloadLoaded({
        silent: true,
      }),
    ]);
  };

  const reconcileLists = async (fallback: string) => {
    try {
      await syncLists();
    } catch (error) {
      notifyError(error, fallback);
    }
  };

  return (
    <div className="board">
      <h1 className="board__title">Список элементов</h1>
      <p className="board__hint">Слева все, справа выбранные. Поиск после обновления страницы сбрасывается.</p>

      <AddItemForm
        loading={addLoading}
        onAdd={async id => {
          setAddLoading(true);
          try {
            await addItem({
              id,
            });
            message.success(`Добавлен ${id}`);
            await syncLists();
          } catch (error) {
            notifyError(error, 'Не удалось добавить');
            throw error;
          } finally {
            setAddLoading(false);
          }
        }}
      />

      <div className="board__cols" style={{ marginTop: 16 }}>
        <AvailableList
          items={available.items}
          count={available.count}
          search={available.search}
          listKey={available.listKey}
          isReplacing={available.isReplacing}
          isLoadingMore={available.isLoadingMore}
          pendingIds={pendingIds}
          onSearch={available.setSearch}
          onLoadMore={available.loadMore}
          onSelect={id => {
            if (pendingIdsRef.current.includes(id)) {
              return;
            }
            markPending([id]);
            runAfterPrevious(async () => {
              try {
                await selectItem({
                  id,
                });
                await syncLists();
              } catch (error) {
                notifyError(error, 'Не выбралось');
                await reconcileLists('Не удалось загрузить список');
              } finally {
                clearPending([id]);
              }
            });
          }}
        />
        <SelectedList
          items={selected.items}
          count={selected.count}
          search={selected.search}
          listKey={selected.listKey}
          isReplacing={selected.isReplacing}
          isLoadingMore={selected.isLoadingMore}
          pendingIds={pendingIds}
          onSearch={selected.setSearch}
          onLoadMore={selected.loadMore}
          onUnselect={id => {
            if (pendingIdsRef.current.includes(id)) {
              return;
            }
            markPending([id]);
            runAfterPrevious(async () => {
              try {
                await unselectItem({
                  id,
                });
                await syncLists();
              } catch (error) {
                notifyError(error, 'Не получилось убрать');
                await reconcileLists('Не удалось загрузить выбранные');
              } finally {
                clearPending([id]);
              }
            });
          }}
          onReorder={(activeId, overId) => {
            if (pendingIdsRef.current.includes(activeId)) {
              return;
            }
            markPending([activeId]);
            selected.setItems(state => moveByIds(state, activeId, overId));
            runAfterPrevious(async () => {
              try {
                await reorderItems({
                  activeId,
                  overId,
                });
                await syncLists();
              } catch (error) {
                notifyError(error, 'Сортировка не сохранилась');
                await reconcileLists('Не удалось загрузить выбранные');
              } finally {
                clearPending([activeId]);
              }
            });
          }}
        />
      </div>
    </div>
  );
};
