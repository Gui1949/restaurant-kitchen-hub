export type StationType = 'GRILL' | 'PIZZA_OVEN' | 'BAR' | 'COLD_PREP' | 'EXPEDITION';

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY_FOR_EXPEDITION' | 'DISPATCHED' | 'CANCELLED';

export interface KitchenItem {
  id: string;
  name: string;
  quantity: number;
  station: StationType;
  specialNotes?: string;
  isReady: boolean;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: number;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: number;
  customerName?: string;
  status: OrderStatus;
  items: KitchenItem[];
  createdAt: Date;
  startedPreparationAt?: Date;
  readyAt?: Date;
  targetPreparationMinutes: number;
}
