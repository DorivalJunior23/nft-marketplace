import { accountHandlers } from './account';
import { authHandlers } from './auth';
import { cartHandlers } from './cart';
import { catalogHandlers } from './catalog';
import { favoritesHandlers } from './favorites';
import { ordersHandlers } from './orders';

export const restHandlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...ordersHandlers,
  ...accountHandlers,
];
