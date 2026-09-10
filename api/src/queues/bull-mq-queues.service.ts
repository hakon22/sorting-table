import { Queue, QueueEvents } from 'bullmq';
import ms from 'ms';
import { Inject, Singleton } from 'typescript-ioc';

import { BullMQQueuesEnum } from '@shared/queues/bull-mq-queues.enum';
import { RedisConnectionService } from '@shared/redis/redis-connection.service';

import type { PaginatedResultInterface } from '@shared/dto/common/paginated-result.dto';
import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';
import type { AddItemJobInterface } from '@shared/queues/add-item-job.interface';
import type { DataItemJobInterface } from '@shared/queues/data-item-job.interface';

@Singleton
export class BullMQQueuesService {
  @Inject
  private readonly redisConnectionService: RedisConnectionService;

  private readonly addWaitMs = ms('30s');

  private readonly dataWaitMs = ms('10s');

  private addQueue: Queue | null = null;

  private dataQueue: Queue | null = null;

  private addEvents: QueueEvents | null = null;

  private dataEvents: QueueEvents | null = null;

  private getBullMqOptions = () => this.redisConnectionService.getBullMqOptions();

  private getAddQueue = () => {
    if (!this.addQueue) {
      this.addQueue = new Queue(BullMQQueuesEnum.ADD_ITEMS, this.getBullMqOptions());
    }
    return this.addQueue;
  };

  private getDataQueue = () => {
    if (!this.dataQueue) {
      this.dataQueue = new Queue(BullMQQueuesEnum.DATA_ITEMS, this.getBullMqOptions());
    }
    return this.dataQueue;
  };

  private getAddEvents = async () => {
    if (!this.addEvents) {
      this.addEvents = new QueueEvents(BullMQQueuesEnum.ADD_ITEMS, this.getBullMqOptions());
      await this.addEvents.waitUntilReady();
    }
    return this.addEvents;
  };

  private getDataEvents = async () => {
    if (!this.dataEvents) {
      this.dataEvents = new QueueEvents(BullMQQueuesEnum.DATA_ITEMS, this.getBullMqOptions());
      await this.dataEvents.waitUntilReady();
    }
    return this.dataEvents;
  };

  /**
   * Ставит add. Повтор с тем же jobId не создаёт вторую задачу — ждём уже стоящую.
   * @param data - новый ID
   */
  public addItem = async (data: AddItemJobInterface) => {
    const queue = this.getAddQueue();
    const events = await this.getAddEvents();
    const job = await queue.add(BullMQQueuesEnum.ADD_ITEMS, data, {
      jobId: `add-${data.id}`,
      removeOnComplete: true,
      removeOnFail: true,
    });
    return job.waitUntilFinished(events, this.addWaitMs);
  };

  /**
   * Ставит задачу и ждёт результат
   * @param data - данные для задачи
   */
  public sendDataJob = async <T = PaginatedResultInterface<ItemFindInterface>>(data: DataItemJobInterface): Promise<T> => {
    const queue = this.getDataQueue();
    const events = await this.getDataEvents();
    const job = await queue.add(BullMQQueuesEnum.DATA_ITEMS, data, {
      removeOnComplete: true,
      removeOnFail: true,
    });

    return job.waitUntilFinished(events, this.dataWaitMs) as Promise<T>;
  };
}
