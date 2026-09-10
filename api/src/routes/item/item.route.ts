import { Inject, Singleton } from 'typescript-ioc';

import { ItemController } from '@api/controllers/item/item.controller';
import { MapResponseDtoMiddleware } from '@api/middleware/map-response-dto.middleware';
import { ValidateDtoMiddleware } from '@api/middleware/validate-dto.middleware';

import { ItemFindDto } from '@shared/dto/item/item-find.dto';
import { ItemFormDto } from '@shared/dto/item/item-form.dto';
import { ItemIdDto } from '@shared/dto/item/item-id.dto';
import { ItemQueryDto } from '@shared/dto/item/item-query.dto';
import { ItemReorderDto } from '@shared/dto/item/item-reorder.dto';

import type { AppRouteInterface } from '@api/routes/app-route.interface';
import type { Router } from 'express';

@Singleton
export class ItemRoute implements AppRouteInterface {
  @Inject
  private readonly itemController: ItemController;

  @Inject
  private readonly validateDtoMiddleware: ValidateDtoMiddleware;

  @Inject
  private readonly mapResponseDtoMiddleware: MapResponseDtoMiddleware;

  /**
   * Вешает item-ручки
   * @param router - общий /api/v1
   */
  public set = (router: Router) => {
    router.get(
      '/items/available',
      this.validateDtoMiddleware.query(ItemQueryDto),
      this.mapResponseDtoMiddleware.paginated(ItemFindDto),
      this.itemController.getAvailable,
    );
    router.get(
      '/items/selected',
      this.validateDtoMiddleware.query(ItemQueryDto),
      this.mapResponseDtoMiddleware.paginated(ItemFindDto),
      this.itemController.getSelected,
    );
    router.post(
      '/items',
      this.validateDtoMiddleware.body(ItemFormDto),
      this.mapResponseDtoMiddleware.one(ItemFindDto),
      this.itemController.addOne,
    );
    router.post(
      '/items/select',
      this.validateDtoMiddleware.body(ItemIdDto),
      this.mapResponseDtoMiddleware.one(ItemFindDto),
      this.itemController.selectOne,
    );
    router.post(
      '/items/unselect',
      this.validateDtoMiddleware.body(ItemIdDto),
      this.mapResponseDtoMiddleware.one(ItemFindDto),
      this.itemController.unselectOne,
    );
    router.post(
      '/items/reorder',
      this.validateDtoMiddleware.body(ItemReorderDto),
      this.mapResponseDtoMiddleware.one(ItemReorderDto),
      this.itemController.reorder,
    );
  };
}
