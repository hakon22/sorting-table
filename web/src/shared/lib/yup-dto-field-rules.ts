import * as yup from 'yup';

import type { DtoInstanceInterface } from '@shared/dto/dto.class';
import type { Rule } from 'antd/es/form';

/**
 * Обязательность поля по shared DTO (`optional !== true` → required)
 */
export const isDtoFieldRequired = <T>(dto: DtoInstanceInterface<T>, fieldName: keyof T & string): boolean => {
  const field = dto.fields[fieldName];
  return field?.optional !== true;
};

/**
 * Ant Design Form.Item rules из shared Yup DTO (одно поле)
 */
export const yupDtoFieldRules = <T>(dto: DtoInstanceInterface<T>, fieldName: keyof T & string): Rule[] => [
  {
    validator: async (_rule, value) => {
      try {
        await dto.schema.validateAt(fieldName, {
          [fieldName]: value,
        });
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          throw new Error(error.errors[0] ?? error.message);
        }
        throw error;
      }
    },
  },
];

/**
 * Props Form.Item, синхронизированные с DTO: label, required-маркер и rules
 */
export const dtoFormItemProps = <T>(dto: DtoInstanceInterface<T>, fieldName: keyof T & string) => {
  const field = dto.fields[fieldName];

  return {
    label: field.label,
    required: isDtoFieldRequired(dto, fieldName),
    rules: yupDtoFieldRules(dto, fieldName),
  };
};
