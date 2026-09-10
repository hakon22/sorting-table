import { Router, type Express } from 'express';
import { Inject, Singleton } from 'typescript-ioc';

import { HttpErrorMiddleware } from '@api/middleware/http-error.middleware';
import { ItemRoute } from '@api/routes/item/item.route';

import type { AppRouteInterface } from '@api/routes/app-route.interface';

@Singleton
export class RouterService {
  @Inject
  private readonly itemRoute: ItemRoute;

  @Inject
  private readonly httpErrorMiddleware: HttpErrorMiddleware;

  /**
   * Новый *Route — @Inject и строка в массиве
   */
  private getRoutes = (): AppRouteInterface[] => [
    this.itemRoute,
  ];

  /**
   * "Вешаем" все модули на /api/v1
   * @param app - express
   */
  public set = (app: Express) => {
    const router = this.httpErrorMiddleware.attach(Router());
    this.getRoutes().forEach(route => {
      route.set(router);
    });
    app.use('/api/v1', router);
    app.use(this.httpErrorMiddleware.handle);
  };
}
