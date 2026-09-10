import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Input, Spin, Typography } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ItemRow } from '@web/components/ItemRow';

import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';

interface SelectedListPropsInterface {
  items: ItemFindInterface[];
  count: number;
  search: string;
  listKey: string;
  isReplacing: boolean;
  isLoadingMore: boolean;
  pendingIds: number[];
  onSearch: (value: string) => void;
  onLoadMore: () => void;
  onUnselect: (id: number) => void;
  onReorder: (activeId: number, overId: number) => void;
}

export const SELECTED_SCROLL_ID = 'selected-scroll';

export const SelectedList = ({
  items,
  count,
  search,
  listKey,
  isReplacing,
  isLoadingMore,
  pendingIds,
  onSearch,
  onLoadMore,
  onUnselect,
  onReorder,
}: SelectedListPropsInterface) => {
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (pendingIds.includes(activeId)) {
      return;
    }
    onReorder(activeId, overId);
  };

  return (
    <div className="window">
      <div className="window__head">
        <Typography.Title level={4}>Выбранные</Typography.Title>
        <Input.Search
          allowClear
          placeholder="Фильтр по ID"
          value={search}
          onChange={event => onSearch(event.target.value)}
        />
      </div>
      <div className="window__list-wrap">
        {isReplacing ? (
          <div className="window__spin">
            <Spin />
          </div>
        ) : null}
        <div id={SELECTED_SCROLL_ID} className="window__list">
          <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext
              items={items.map(item => String(item.id))}
              strategy={verticalListSortingStrategy}
            >
              <InfiniteScroll
                key={listKey}
                dataLength={items.length}
                next={onLoadMore}
                hasMore={!isReplacing && items.length < count}
                loader={isLoadingMore ? (
                  <div className="window__more">
                    <Spin size="small" />
                  </div>
                ) : null}
                scrollableTarget={SELECTED_SCROLL_ID}
              >
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    sortable
                    pending={pendingIds.includes(item.id)}
                    onPick={onUnselect}
                  />
                ))}
              </InfiniteScroll>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
