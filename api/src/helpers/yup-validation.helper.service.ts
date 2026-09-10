import { isFunction } from 'lodash-es';
import { Singleton } from 'typescript-ioc';

import type { DtoInstanceInterface } from '@shared/dto/dto.class';
import type { ValidationError } from 'yup';

@Singleton
export class YupValidationHelperService {
  /**
   * Склеивает ошибки Yup в одну строку
   * @param error - ValidationError
   * @returns текст для 400
   */
  public formatError = (error: ValidationError): string => {
    if (isFunction(error.errors?.join)) {
      return error.errors.join(' ');
    }
    return error.message;
  };

  /**
   * Парсит payload через DTO
   * @param dto - инстанс фабрики
   * @param value - body/query
   */
  public parse = async <T>(dto: DtoInstanceInterface<T>, value: unknown): Promise<T> => {
    return dto.parse(value);
  };
}
