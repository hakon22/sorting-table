import { Inject, Singleton } from 'typescript-ioc';
import * as yup from 'yup';

import { YupValidationHelperService } from '@api/helpers/yup-validation.helper.service';

import { AppHttpError } from '@shared/errors/app-http.error';
import { LoggerService } from '@shared/logger/logger.service';

import type { ErrorRequestHandler, RequestHandler, Router } from 'express';

@Singleton
export class HttpErrorMiddleware {
  private readonly TAG = 'HttpErrorMiddleware';

  private readonly routeMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;

  @Inject
  private readonly loggerService: LoggerService;

  @Inject
  private readonly yupValidationHelperService: YupValidationHelperService;

  /**
   * Оборачивает handler в try/catch
   * @param handler - миддлвара / контроллер
   */
  public wrap = (handler: RequestHandler): RequestHandler => {
    return (req, res, next) => {
      try {
        Promise.resolve(handler(req, res, next)).catch(next);
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * Оборачивает get/post/... чтобы контроллеры могли бросать ошибки
   * @param router - express Router
   */
  public attach = (router: Router): Router => {
    this.routeMethods.forEach(method => {
      const original = router[method].bind(router);
      router[method] = ((path: string, ...handlers: RequestHandler[]) => {
        return original(path, ...handlers.map(handler => this.wrap(handler)));
      }) as typeof router.get;
    });
    return router;
  };

  /**
   * Единый JSON ошибок
   */
  public handle: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    this.loggerService.error(this.TAG, error);

    if (error instanceof yup.ValidationError) {
      res.status(400).json({
        statusCode: 400,
        message: this.yupValidationHelperService.formatError(error),
        error: 'Bad Request',
      });
      return;
    }

    const appHttpError = AppHttpError.fromCaught(error);
    if (appHttpError) {
      res.status(appHttpError.statusCode).json({
        statusCode: appHttpError.statusCode,
        message: appHttpError.clientMessage,
        error: appHttpError.clientMessage,
      });
      return;
    }

    const name = error instanceof Error ? error.name : 'Error';
    const message = error instanceof Error ? error.message : String(error);
    const text = `${name}: ${message}`;

    res.status(500).json({
      statusCode: 500,
      message: error instanceof Error ? error.message : text,
      error: text,
    });
  };
}
