import ms from 'ms';
import { Inject, Singleton } from 'typescript-ioc';

import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '@shared/dto/common/pagination.dto';
import { LoggerService } from '@shared/logger/logger.service';
import { DataJobActionEnum, type DataItemJobInterface } from '@shared/queues/data-item-job.interface';

import { ItemStore } from '@worker/item.store';

interface PendingDataInterface {
  data: DataItemJobInterface;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

@Singleton
export class DataBatchHelperService {
  private readonly TAG = 'DataBatchHelperService';

  private readonly dataBatchMs = ms('1s');

  private pending: PendingDataInterface[] = [];

  @Inject
  private readonly itemStore: ItemStore;

  @Inject
  private readonly loggerService: LoggerService;

  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Запускает таймер батча data
   */
  public start = () => {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.flush();
    }, this.dataBatchMs);
  };

  /**
   * Кладёт задачу в окно 1с, порядок сохраняется
   */
  public enqueue = (data: DataItemJobInterface): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      this.pending.push({
        data,
        resolve,
        reject,
      });
    });
  };

  private apply = (data: DataItemJobInterface): unknown => {
    const limit = data.limit ?? DEFAULT_LIMIT;
    const offset = data.offset ?? DEFAULT_OFFSET;

    switch (data.action) {
      case DataJobActionEnum.GET_AVAILABLE:
        return this.itemStore.getAvailable(data.search, offset, limit);
      case DataJobActionEnum.GET_SELECTED:
        return this.itemStore.getSelected(data.search, offset, limit);
      case DataJobActionEnum.SELECT:
        this.itemStore.selectOne(data.id as number);
        return {
          id: data.id,
        };
      case DataJobActionEnum.UNSELECT:
        this.itemStore.unselectOne(data.id as number);
        return {
          id: data.id,
        };
      case DataJobActionEnum.REORDER:
        this.itemStore.reorder(data.activeId as number, data.overId as number);
        return {
          activeId: data.activeId,
          overId: data.overId,
        };
      default:
        throw new Error(`Неизвестное действие ${data.action}`);
    }
  };

  private flush = () => {
    if (this.pending.length === 0) {
      return;
    }

    const batch = this.pending;
    this.pending = [];

    batch.forEach(item => {
      try {
        item.resolve(this.apply(item.data));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.loggerService.error(this.TAG, err.message, ':(');
        item.reject(err);
      }
    });
  };
}
