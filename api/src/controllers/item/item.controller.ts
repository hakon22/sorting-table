import { Inject, Singleton } from 'typescript-ioc';

import { BullMQQueuesService } from '@api/queues/bull-mq-queues.service';
import { BaseService } from '@api/services/app/base.service';

import { DataJobActionEnum } from '@shared/queues/data-item-job.interface';

import type { ItemFormInterface } from '@shared/dto/item/item-form.dto';
import type { ItemIdInterface } from '@shared/dto/item/item-id.dto';
import type { ItemQueryInterface } from '@shared/dto/item/item-query.dto';
import type { ItemReorderInterface } from '@shared/dto/item/item-reorder.dto';
import type { Request, Response } from 'express';

@Singleton
export class ItemController extends BaseService {
  private readonly TAG = 'ItemController';

  @Inject
  private readonly bullMQQueuesService: BullMQQueuesService;

  /**
   * Левый список (не выбранные)
   */
  public getAvailable = async (req: Request, res: Response) => {
    const query = this.getQuery<ItemQueryInterface>(req);
    const page = await this.bullMQQueuesService.sendDataJob({
      action: DataJobActionEnum.GET_AVAILABLE,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });
    res.json(page);
  };

  /**
   * Правый список (выбранные)
   */
  public getSelected = async (req: Request, res: Response) => {
    const query = this.getQuery<ItemQueryInterface>(req);
    const page = await this.bullMQQueuesService.sendDataJob({
      action: DataJobActionEnum.GET_SELECTED,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });
    res.json(page);
  };

  /**
   * Добавление ID (батч на воркере ~10с)
   */
  public addOne = async (req: Request, res: Response) => {
    const body = this.getBody<ItemFormInterface>(req);
    this.loggerService.info(this.TAG, `очередь add ${body.id}`);
    const result = await this.bullMQQueuesService.addItem({
      id: body.id,
    });
    res.json(result);
  };

  /**
   * Перенос в выбранные
   */
  public selectOne = async (req: Request, res: Response) => {
    const body = this.getBody<ItemIdInterface>(req);
    const result = await this.bullMQQueuesService.sendDataJob({
      action: DataJobActionEnum.SELECT,
      id: body.id,
    });
    res.json(result);
  };

  /**
   * Снять выбор
   */
  public unselectOne = async (req: Request, res: Response) => {
    const body = this.getBody<ItemIdInterface>(req);
    const result = await this.bullMQQueuesService.sendDataJob({
      action: DataJobActionEnum.UNSELECT,
      id: body.id,
    });
    res.json(result);
  };

  /**
   * DnD порядок выбранных
   */
  public reorder = async (req: Request, res: Response) => {
    const body = this.getBody<ItemReorderInterface>(req);
    const result = await this.bullMQQueuesService.sendDataJob({
      action: DataJobActionEnum.REORDER,
      activeId: body.activeId,
      overId: body.overId,
    });
    res.json(result);
  };
}
