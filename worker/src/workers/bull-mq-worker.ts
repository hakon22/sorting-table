import { Worker } from 'bullmq';
import { Inject, Singleton } from 'typescript-ioc';

import { LoggerService } from '@shared/logger/logger.service';
import { BullMQQueuesEnum } from '@shared/queues/bull-mq-queues.enum';
import { RedisConnectionService } from '@shared/redis/redis-connection.service';

import { AddBatchHelperService } from '@worker/helpers/add-batch.helper.service';
import { DataBatchHelperService } from '@worker/helpers/data-batch.helper.service';

import type { AddItemJobInterface } from '@shared/queues/add-item-job.interface';
import type { DataItemJobInterface } from '@shared/queues/data-item-job.interface';

@Singleton
export class BullMQWorker {
  private readonly TAG = 'BullMQWorker';

  private readonly workerConcurrency = 1000;

  @Inject
  private readonly redisConnectionService: RedisConnectionService;

  @Inject
  private readonly addBatchHelperService: AddBatchHelperService;

  @Inject
  private readonly dataBatchHelperService: DataBatchHelperService;

  @Inject
  private readonly loggerService: LoggerService;

  /**
   * Слушает очереди ADD/DATA
   */
  public start = () => {
    const bullMqOptions = this.redisConnectionService.getBullMqOptions();

    this.addBatchHelperService.start();
    this.dataBatchHelperService.start();

    const addWorker = new Worker<AddItemJobInterface>(
      BullMQQueuesEnum.ADD_ITEMS,
      job => this.addBatchHelperService.enqueue(job.data),
      {
        ...bullMqOptions,
        concurrency: this.workerConcurrency,
      },
    );

    const dataWorker = new Worker<DataItemJobInterface>(
      BullMQQueuesEnum.DATA_ITEMS,
      job => this.dataBatchHelperService.enqueue(job.data),
      {
        ...bullMqOptions,
        concurrency: this.workerConcurrency,
      },
    );

    addWorker.on('failed', (job, error) => {
      this.loggerService.error(this.TAG, `add failed ${job?.id}`, error);
    });

    dataWorker.on('failed', (job, error) => {
      this.loggerService.error(this.TAG, `data failed ${job?.id}`, error);
    });

    this.loggerService.info(this.TAG, 'воркер очередей запущен');
  };
}
