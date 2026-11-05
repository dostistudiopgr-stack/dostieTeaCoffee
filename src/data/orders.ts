import type { Order } from '../types';
import { loadOrdersFromStorage, updateOrderInStorage } from '../utils/orderUtils';

export function getAllOrders(): Order[] {
  return loadOrdersFromStorage();
}

export function getOrdersByUserId(userId: string): Order[] {
  return getAllOrders().filter((order) => order.userId === userId);
}

export function getOrderById(id: string): Order | undefined {
  return getAllOrders().find((order) => order.id === id);
}

export { updateOrderInStorage };
