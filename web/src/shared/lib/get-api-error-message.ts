import axios, { type AxiosError } from 'axios';
import { isArray, isNil, isObject, isString } from 'lodash-es';

interface ApiErrorBodyInterface {
  message?: unknown;
  error?: unknown;
}

/**
 * Достаёт тело ответа axios
 */
const getAxiosResponseData = (error: unknown): unknown => {
  if (axios.isAxiosError(error)) {
    return error.response?.data;
  }

  if (isObject(error) && 'isAxiosError' in error && (error as AxiosError).isAxiosError === true) {
    return (error as AxiosError).response?.data;
  }

  if (isObject(error) && 'response' in error) {
    return (error as AxiosError).response?.data;
  }

  return undefined;
};

/**
 * Нормализует поле message/error
 */
const pickErrorText = (value: unknown): string | undefined => {
  if (isString(value) && value.length) {
    return value;
  }

  if (isArray(value) && value.every(isString) && value.length) {
    return value.join('; ');
  }

  return undefined;
};

/**
 * Запрос отменён (смена фильтра / новая загрузка)
 */
export const isAbortError = (error: unknown): boolean => {
  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
    return true;
  }

  return error instanceof Error && (error.name === 'CanceledError' || error.name === 'AbortError');
};

/**
 * Текст ошибки из ответа API
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const data = getAxiosResponseData(error);

  if (isNil(data)) {
    return fallback;
  }

  if (isString(data) && data.length) {
    return data;
  }

  if (!isObject(data)) {
    return fallback;
  }

  const body = data as ApiErrorBodyInterface;

  return pickErrorText(body.message)
    ?? pickErrorText(body.error)
    ?? fallback;
};
