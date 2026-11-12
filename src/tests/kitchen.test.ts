import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KitchenManager } from '../services/kitchen-manager.js';

describe('Restaurant Kitchen Display System (KDS) Suite', () => {
  it('deve registrar comanda de restaurante e distribuir itens por estacao de preparo', () => {
    const manager = new KitchenManager();

    const order = manager.createOrder(
      'DINE_IN',
      [
        { name: 'Picanha na Brasa com Fritas', quantity: 1, station: 'GRILL' },
        { name: 'Salada Ceasar Especial', quantity: 1, station: 'COLD_PREP' },
        { name: 'Chopp Artesanal 500ml', quantity: 2, station: 'BAR' },
      ],
      { tableNumber: 14 }
    );

    assert.ok(order.id);
    assert.strictEqual(order.orderNumber, 101);
    assert.strictEqual(order.status, 'RECEIVED');
    assert.strictEqual(order.items.length, 3);

    const grillQueue = manager.getActiveOrdersByStation('GRILL');
    assert.strictEqual(grillQueue.length, 1);
    assert.strictEqual(grillQueue[0].item.name, 'Picanha na Brasa com Fritas');

    const barQueue = manager.getActiveOrdersByStation('BAR');
    assert.strictEqual(barQueue.length, 1);
    assert.strictEqual(barQueue[0].item.name, 'Chopp Artesanal 500ml');
  });

  it('deve transicionar status do pedido e encaminhar para expedicao quando todos os itens ficarem prontos', () => {
    const manager = new KitchenManager();
    const orderEvents: string[] = [];

    manager.subscribe((event) => orderEvents.push(event));

    const order = manager.createOrder(
      'DELIVERY',
      [
        { name: 'Pizza Margherita Grande', quantity: 1, station: 'PIZZA_OVEN' },
        { name: 'Refrigerante Lata', quantity: 1, station: 'BAR' },
      ],
      { customerName: 'Renata Castro' }
    );

    // Iniciar preparo
    manager.startPreparation(order.id);
    const inPrep = manager.getOrder(order.id);
    assert.strictEqual(inPrep?.status, 'PREPARING');

    // Concluir primeiro item (Refrigerante no Bar)
    manager.markItemReady(order.id, order.items[1].id);
    assert.strictEqual(manager.getOrder(order.id)?.status, 'PREPARING');

    // Concluir segundo item (Pizza no Forno) -> Deve mover toda a comanda para READY_FOR_EXPEDITION
    manager.markItemReady(order.id, order.items[0].id);
    const readyOrder = manager.getOrder(order.id);
    assert.strictEqual(readyOrder?.status, 'READY_FOR_EXPEDITION');
    assert.ok(readyOrder?.readyAt);

    // Despachar para entregador
    manager.dispatchOrder(order.id);
    assert.strictEqual(manager.getOrder(order.id)?.status, 'DISPATCHED');

    assert.ok(orderEvents.includes('ORDER_RECEIVED'));
    assert.ok(orderEvents.includes('PREPARATION_STARTED'));
    assert.ok(orderEvents.includes('ITEM_READY'));
    assert.ok(orderEvents.includes('ORDER_READY'));
    assert.ok(orderEvents.includes('ORDER_DISPATCHED'));
  });
});
