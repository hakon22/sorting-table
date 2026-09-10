import { Inject, Singleton } from 'typescript-ioc';
import * as yup from 'yup';

import { YupValidationHelperService } from '@api/helpers/yup-validation.helper.service';

import type { DtoInstanceInterface } from '@shared/dto/dto.class';
import type { NextFunction, Request, Response } from 'express';

interface MapResponseDtoOptionsInterface {
  isArray?: boolean;
  paginated?: boolean;
}

@Singleton
export class MapResponseDtoMiddleware {
  @Inject
  private readonly yupValidationHelperService: YupValidationHelperService;

  /**
   * Ответ — страница с items
   * @param dto - DTO элемента
   */
  public paginated = (dto: DtoInstanceInterface) => this.create(dto, {
    paginated: true,
  });

  /**
   * Ответ — один объект
   * @param dto - DTO ответа
   */
  public one = (dto: DtoInstanceInterface) => this.create(dto, {});

  /**
   * Ответ — массив
   * @param dto - DTO элемента
   */
  public many = (dto: DtoInstanceInterface) => this.create(dto, {
    isArray: true,
  });

  private create = (dto: DtoInstanceInterface, options: MapResponseDtoOptionsInterface) => {
    return (_req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res);

      res.json = (body: unknown) => {
        if (res.statusCode >= 400) {
          return originalJson(body);
        }

        try {
          return originalJson(this.mapData(body, dto, options));
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            res.status(500);
            return originalJson({
              statusCode: 500,
              message: this.yupValidationHelperService.formatError(error),
              error: 'Internal Server Error',
            });
          }
          throw error;
        }
      };

      next();
    };
  };

  private mapData = (data: unknown, dto: DtoInstanceInterface, options: MapResponseDtoOptionsInterface): unknown => {
    if (options.paginated === true) {
      const page = data as {
        items?: object[];
      };
      return {
        ...page,
        items: (page.items ?? []).map(item => dto.fromEntity(item)),
      };
    }

    if (options.isArray === true) {
      if (!Array.isArray(data)) {
        throw new Error('Ожидался массив в ответе');
      }
      return data.map(item => dto.fromEntity(item as object));
    }

    return dto.fromEntity(data as object);
  };
}
