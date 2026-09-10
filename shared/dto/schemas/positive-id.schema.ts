import * as yup from 'yup';

/**
 * Числовой id из path/query (string → number)
 */
export const positiveIdSchema = yup
  .number()
  .transform((_value, originalValue) => {
    if (typeof originalValue === 'string' && originalValue.trim() !== '') {
      return Number(originalValue);
    }
    return originalValue;
  })
  .integer()
  .positive();
