import ms from 'ms';
import { Inject, Singleton } from 'typescript-ioc';

import { LoggerService } from '@shared/logger/logger.service';

import { ItemStore } from '@worker/item.store';

import type { AddItemJobInterface } from '@shared/queues/add-item-job.interface';

interface PendingAddInterface {
  id: number;
  resolve: (value: { id: number; }) => void;
  reject: (error: Error) => void;
}

@Singleton
export class AddBatchHelperService {
  private readonly TAG = 'AddBatchHelperService';

  private readonly addBatchMs = ms('10s');

  private readonly pending = new Map<number, PendingAddInterface[]>();

  @Inject
  private readonly itemStore: ItemStore;

  @Inject
  private readonly loggerService: LoggerService;

  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Запускает таймер батча add
   */
  public start = () => {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.flush();
    }, this.addBatchMs);
  };

  /**
   * Кладёт add в окно 10с (дедупликация по id внутри пачки)
   */
  public enqueue = (data: AddItemJobInterface): Promise<{ id: number; }> => {
    return new Promise((resolve, reject) => {
      const waiters = this.pending.get(data.id) ?? [];
      waiters.push({
        id: data.id,
        resolve,
        reject,
      });
      this.pending.set(data.id, waiters);
    });
  };

  private flush = () => {
    if (this.pending.size === 0) {
      return;
    }

    const batch = new Map(this.pending);
    this.pending.clear();
    this.loggerService.info(this.TAG, `обработали пачку add (${batch.size})`);

    batch.forEach((waiters, id) => {
      try {
        this.itemStore.addOne(id);
        waiters.forEach(waiter => waiter.resolve({
          id,
        }));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        waiters.forEach(waiter => waiter.reject(err));
      }
    });
  };
}
