import { HolderOutlined, LoadingOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';

interface ItemRowPropsInterface {
  item: ItemFindInterface;
  sortable?: boolean;
  pending?: boolean;
  onPick: (id: number) => void;
}

export const ItemRow = ({ item, sortable, pending, onPick }: ItemRowPropsInterface) => {
  const skippedClickRef = useRef(false);
  const sortableApi = useSortable({
    id: String(item.id),
    disabled: !sortable || pending,
  });

  useEffect(() => {
    if (sortableApi.isDragging) {
      skippedClickRef.current = true;
    }
  }, [sortableApi.isDragging]);

  const style = sortable
    ? {
      transform: CSS.Transform.toString(sortableApi.transform),
      transition: sortableApi.transition,
    }
    : undefined;

  const actionLabel = sortable ? 'убрать' : 'выбрать';

  return (
    <div
      ref={sortable ? sortableApi.setNodeRef : undefined}
      className={classNames('item-row', {
        'item-row--pending': pending,
      })}
      style={style}
      onClick={() => {
        if (pending || sortableApi.isDragging) {
          return;
        }
        if (skippedClickRef.current) {
          skippedClickRef.current = false;
          return;
        }
        onPick(item.id);
      }}
    >
      <span className="item-row__id">
        {sortable ? (
          <span
            className="item-row__handle"
            ref={sortableApi.setActivatorNodeRef}
            {...sortableApi.listeners}
            {...sortableApi.attributes}
            onClick={event => event.stopPropagation()}
          >
            <HolderOutlined />
          </span>
        ) : null}
        ID {item.id}
      </span>
      <span className="item-row__action">
        {pending ? <LoadingOutlined /> : actionLabel}
      </span>
    </div>
  );
};
