import '@shared/load-env';
import 'reflect-metadata';

import { Container } from 'typescript-ioc';

import { LoggerService } from '@shared/logger/logger.service';

import { BullMQWorker } from '@worker/workers/bull-mq-worker';

Container
  .get(BullMQWorker)
  .start();

Container
  .get(LoggerService)
  .info('Worker', 'Воркер sorting-table запущен');
