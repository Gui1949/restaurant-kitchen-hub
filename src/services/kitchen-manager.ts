import { KitchenItem, OrderStatus, RestaurantOrder, StationType } from '../domain/restaurant-order.js';
import { randomUUID } from 'crypto';

export class KitchenManager {
  private orders: Map<string, RestaurantOrder> = new Map();
  private nextOrderNumber: number = 101;
  private listeners: Array<(event: string, data: unknown) => void> = [];

  subscribe(listener: (event: string, data: unknown) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach((l) => l(event, data));
  }

  createOrder(
    type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY',
    items: Omit<KitchenItem, 'id' | 'isReady'>[],
    options?: { tableNumber?: number; customerName?: string; targetMinutes?: number }
  ): RestaurantOrder {
    const orderId = randomUUID();
    const order: RestaurantOrder = {
      id: orderId,
      orderNumber: this.nextOrderNumber++,
      type,
      tableNumber: options?.tableNumber,
      customerName: options?.customerName,
      status: 'RECEIVED',
      items: items.map((item) => ({ ...item, id: randomUUID(), isReady: false })),
      createdAt: new Date(),
      targetPreparationMinutes: options?.targetMinutes || 20,
    };

    this.orders.set(orderId, order);
    this.emit('ORDER_RECEIVED', order);
    return order;
  }

  startPreparation(orderId: string): RestaurantOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);
    if (order.status !== 'RECEIVED') {
      throw new Error(`Pedido não pode iniciar preparo com status: ${order.status}`);
    }

    order.status = 'PREPARING';
    order.startedPreparationAt = new Date();
    this.orders.set(orderId, order);
    this.emit('PREPARATION_STARTED', order);
    return order;
  }

  markItemReady(orderId: string, itemId: string): RestaurantOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} não encontrado no pedido.`);

    item.isReady = true;

    // Se todos os itens da comanda estiverem prontos, move para expedição
    const allReady = order.items.every((i) => i.isReady);
    if (allReady) {
      order.status = 'READY_FOR_EXPEDITION';
      order.readyAt = new Date();
      this.emit('ORDER_READY', order);
    } else {
      this.emit('ITEM_READY', { orderId, item });
    }

    this.orders.set(orderId, order);
    return order;
  }

  dispatchOrder(orderId: string): RestaurantOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);
    if (order.status !== 'READY_FOR_EXPEDITION') {
      throw new Error(`Apenas pedidos prontos podem ser despachados.`);
    }

    order.status = 'DISPATCHED';
    this.orders.set(orderId, order);
    this.emit('ORDER_DISPATCHED', order);
    return order;
  }

  getActiveOrdersByStation(station: StationType): Array<{ orderId: string; orderNumber: number; item: KitchenItem }> {
    const result: Array<{ orderId: string; orderNumber: number; item: KitchenItem }> = [];
    for (const order of this.orders.values()) {
      if (order.status === 'PREPARING' || order.status === 'RECEIVED') {
        const stationItems = order.items.filter((i) => i.station === station && !i.isReady);
        for (const item of stationItems) {
          result.push({ orderId: order.id, orderNumber: order.orderNumber, item });
        }
      }
    }
    return result;
  }

  getOrder(orderId: string): RestaurantOrder | undefined {
    return this.orders.get(orderId);
  }
}
