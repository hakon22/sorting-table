import { Inject, Singleton } from 'typescript-ioc';

import { YupValidationHelperService } from '@api/helpers/yup-validation.helper.service';

import type { DtoInstanceInterface } from '@shared/dto/dto.class';
import type { NextFunction, Request, Response } from 'express';

@Singleton
export class ValidateDtoMiddleware {
  @Inject
  private readonly yupValidationHelperService: YupValidationHelperService;

  /**
   * Валидация query
   * @param dto - DTO запроса
   */
  public query = (dto: DtoInstanceInterface) => this.create('query', dto);

  /**
   * Валидация body
   * @param dto - DTO тела
   */
  public body = (dto: DtoInstanceInterface) => this.create('body', dto);

  private create = (source: 'body' | 'query', dto: DtoInstanceInterface) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
      req[source] = await this.yupValidationHelperService.parse(dto, req[source]);
      next();
    };
  };
}
