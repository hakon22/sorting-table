import { Input, Spin, Typography } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ItemRow } from '@web/components/ItemRow';

import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';

interface AvailableListPropsInterface {
  items: ItemFindInterface[];
  count: number;
  search: string;
  listKey: string;
  isReplacing: boolean;
  isLoadingMore: boolean;
  pendingIds: number[];
  onSearch: (value: string) => void;
  onLoadMore: () => void;
  onSelect: (id: number) => void;
}

export const AVAILABLE_SCROLL_ID = 'available-scroll';

export const AvailableList = ({
  items,
  count,
  search,
  listKey,
  isReplacing,
  isLoadingMore,
  pendingIds,
  onSearch,
  onLoadMore,
  onSelect,
}: AvailableListPropsInterface) => {
  return (
    <div className="window">
      <div className="window__head">
        <Typography.Title level={4}>Доступные</Typography.Title>
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
        <div id={AVAILABLE_SCROLL_ID} className="window__list">
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
            scrollableTarget={AVAILABLE_SCROLL_ID}
          >
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                pending={pendingIds.includes(item.id)}
                onPick={onSelect}
              />
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};
