import * as yup from 'yup';

/**
 * Число из query (string → number)
 */
export const queryIntegerSchema = yup
  .number()
  .transform((_value, originalValue) => {
    if (typeof originalValue === 'string' && originalValue.trim() !== '') {
      return Number(originalValue);
    }
    return originalValue;
  })
  .integer();
