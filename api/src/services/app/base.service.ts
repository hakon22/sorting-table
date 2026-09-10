import { Inject } from 'typescript-ioc';

import { LoggerService } from '@shared/logger/logger.service';

import type { Request } from 'express';

export abstract class BaseService {
  @Inject
  protected readonly loggerService: LoggerService;

  protected getQuery = <T>(req: Request): T => req.query as T;

  protected getBody = <T>(req: Request): T => req.body as T;
}
