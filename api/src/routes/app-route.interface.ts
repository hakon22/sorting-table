import type { Router } from 'express';

/** Модуль роутов, "вешается" на общий /api/v1 */
export interface AppRouteInterface {
  set: (router: Router) => void;
}
