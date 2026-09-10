import { isNil, mapValues } from 'lodash-es';
import * as yup from 'yup';

export interface DtoFieldInterface {
  label: string;
  /** Допускает отсутствие поля и `null` */
  optional?: boolean;
  /** Схема Yup для поля */
  schema?: yup.AnySchema;
  /** DTO для вложенного поля */
  nested?: () => DtoInstanceInterface;
  /** Является ли поле массивом */
  isArray?: boolean;
  /** Для string: trim (по умолчанию true) */
  trim?: boolean;
  /** Для number: .integer() (по умолчанию true) */
  integer?: boolean;
  /** Для number: .positive() (по умолчанию true) */
  positive?: boolean;
  /** Ключ в entity, если отличается от ключа DTO */
  sourceKey?: string;
}

/** Поле-массив вложенных DTO: `isArray` + `nested` */
export type DtoNestedArrayFieldInterface<T = unknown> = Omit<DtoFieldInterface, 'schema' | 'isArray' | 'nested'> & {
  isArray: true;
  nested: () => DtoInstanceInterface<T>;
  schema?: never;
};

/** Поле-массив скаляров: `isArray` + `schema` элемента (`string[]`, `number[]`, …) */
export type DtoSchemaArrayFieldInterface = Omit<DtoFieldInterface, 'isArray' | 'nested'> & {
  isArray: true;
  schema: yup.AnySchema;
  nested?: never;
};

/** Поле-массив: либо nested DTO, либо schema элемента */
export type DtoArrayFieldInterface<T = unknown> =
  | DtoNestedArrayFieldInterface<T>
  | DtoSchemaArrayFieldInterface;

/** Скаляр / объект: `isArray` запрещён */
export type DtoScalarFieldInterface = Omit<DtoFieldInterface, 'isArray'> & {
  isArray?: false;
};

/**
 * Карта полей DTO, согласованная с interface:
 * массивы → isArray + nested | schema; остальное → без isArray
 */
export type DtoFieldsMapInterface<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends readonly (infer E)[]
    ? DtoArrayFieldInterface<E>
    : DtoScalarFieldInterface;
};

export interface DtoInstanceInterface<T = unknown> {
  fields: Record<string, DtoFieldInterface>;
  schema: yup.ObjectSchema<yup.AnyObject>;
  parse: (value: unknown) => Promise<T>;
  parseSync: (value: unknown) => T;
  /**
   * Entity → DTO: поля по keys/`sourceKey` (геттеры), Date→ISO, numeric-строки→number, затем parseSync
   */
  fromEntity: (entity: object) => T;
}

const isStringSchema = (schema: yup.AnySchema): boolean => {
  return schema.type === 'string';
};

const isNumberSchema = (schema: yup.AnySchema): boolean => {
  return schema.type === 'number';
};

const buildFieldSchema = (field: DtoFieldInterface): yup.AnySchema => {
  let schema: yup.AnySchema;

  if (!isNil(field.nested)) {
    const nestedDto = field.nested();
    schema = field.isArray === true
      ? yup.array().of(nestedDto.schema)
      : nestedDto.schema;
  } else if (!isNil(field.schema)) {
    schema = field.schema;
    if (isStringSchema(schema) && field.trim !== false) {
      schema = (schema as yup.StringSchema).trim();
    }
    if (isNumberSchema(schema)) {
      // numeric из БД часто приходит строкой
      schema = (schema as yup.NumberSchema).transform((value, originalValue) => {
        if (typeof originalValue === 'string' && originalValue.trim() !== '') {
          const parsed = Number(originalValue);
          return Number.isFinite(parsed) ? parsed : value;
        }
        return value;
      });
      if (field.integer !== false) {
        schema = (schema as yup.NumberSchema).integer();
      }
      if (field.positive !== false) {
        schema = (schema as yup.NumberSchema).positive();
      }
    }
    if (field.isArray === true) {
      schema = yup.array().of(schema);
    }
  } else {
    throw new Error(`DTO field "${field.label}" must define schema or nested`);
  }

  schema = schema.label(field.label);

  if (field.optional === true) {
    return schema.nullable().notRequired().default(undefined);
  }

  return schema.required(`${field.label} обязательно`);
};

const buildObjectSchema = (fields: Record<string, DtoFieldInterface>): yup.ObjectSchema<yup.AnyObject> => {
  const shape: Record<string, yup.AnySchema> = {};

  Object.keys(fields).forEach(key => {
    shape[key] = buildFieldSchema(fields[key]);
  });

  return yup.object().shape(shape);
};

const createInstance = <T>(fields: Record<string, DtoFieldInterface>): DtoInstanceInterface<T> => {
  let cachedSchema: yup.ObjectSchema<yup.AnyObject> | null = null;

  const getSchema = (): yup.ObjectSchema<yup.AnyObject> => {
    if (isNil(cachedSchema)) {
      cachedSchema = buildObjectSchema(fields);
    }
    return cachedSchema;
  };

  const parseSync = (value: unknown): T => {
    return getSchema().validateSync(value, {
      abortEarly: false,
      stripUnknown: true,
    }) as T;
  };

  const fromEntity = (entity: object): T => {
    const source = entity as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    Object.keys(fields).forEach(key => {
      const field = fields[key];
      const sourceKey = field.sourceKey ?? key;
      const raw = source[sourceKey];

      if (!isNil(field.nested) && !isNil(raw)) {
        const nestedDto = field.nested();
        payload[key] = field.isArray === true
          ? (raw as object[]).map(item => nestedDto.fromEntity(item))
          : nestedDto.fromEntity(raw as object);
        return;
      }

      // Date → ISO для string-полей Find DTO
      payload[key] = raw instanceof Date ? raw.toISOString() : raw;
    });

    return parseSync(payload);
  };

  return {
    fields,
    get schema() {
      return getSchema();
    },
    parse: async (value: unknown): Promise<T> => {
      return getSchema().validate(value, {
        abortEarly: false,
        stripUnknown: true,
      }) as Promise<T>;
    },
    parseSync,
    fromEntity,
  };
};

/**
 * Фабрика DTO на базе Yup
 */
export class Dto {
  /**
   * Создаёт DTO из карты полей (типы полей сверяются с interface `T`)
   */
  public static create = <T>(fields: DtoFieldsMapInterface<T>): DtoInstanceInterface<T> => {
    return createInstance<T>(fields as Record<string, DtoFieldInterface>);
  };

  /**
   * Все поля optional: true
   */
  public static partial = <T = unknown>(source: DtoInstanceInterface): DtoInstanceInterface<T> => {
    const fields = mapValues(source.fields, field => {
      const {
        optional: _optional,
        ...rest
      } = field;

      return {
        ...rest,
        optional: true,
      };
    });

    return createInstance<T>(fields);
  };

  /**
   * Слияние карт полей (правый перекрывает)
   */
  public static union = <T = unknown>(...sources: DtoInstanceInterface[]): DtoInstanceInterface<T> => {
    const fields: Record<string, DtoFieldInterface> = {};

    sources.forEach(source => {
      Object.assign(fields, source.fields);
    });

    return createInstance<T>(fields);
  };
}
