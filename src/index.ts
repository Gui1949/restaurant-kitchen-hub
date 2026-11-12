import { KitchenManager } from './services/kitchen-manager.js';

async function main() {
  console.log('🍽️ Iniciando GourmetFlow KDS (Kitchen Display System)\n');
  const kitchen = new KitchenManager();

  kitchen.subscribe((event, data) => {
    console.log(`📡 [WebSocket Event]: ${event} ->`, typeof data === 'object' ? JSON.stringify(data).slice(0, 80) + '...' : data);
  });

  // 1. Garçom lança pedido no salão
  console.log('📝 1. Mesa 08 realizou pedido no salão:');
  const order = kitchen.createOrder(
    'DINE_IN',
    [
      { name: 'Bife Ancho com Chimichurri', quantity: 2, station: 'GRILL', specialNotes: 'Ao ponto pra menos' },
      { name: 'Batata Rústica com Alecrim', quantity: 1, station: 'GRILL' },
      { name: 'Caipirinha de Limão Siciliano', quantity: 2, station: 'BAR' }
    ],
    { tableNumber: 8, targetMinutes: 25 }
  );
  console.log(`✅ Comanda #${order.orderNumber} registrada no sistema!\n`);

  // 2. Chef inicia a linha de produção
  console.log('🔥 2. Cozinha aceita a comanda e inicia preparo...');
  kitchen.startPreparation(order.id);

  // 3. Bar finaliza bebidas
  console.log('\n🍸 3. Bar finaliza drinks...');
  const barItem = order.items.find((i) => i.station === 'BAR')!;
  kitchen.markItemReady(order.id, barItem.id);

  // 4. Parrilla finaliza carnes e guarnições
  console.log('🥩 4. Estação Grill finaliza cortes...');
  const grillItems = order.items.filter((i) => i.station === 'GRILL');
  grillItems.forEach((item) => kitchen.markItemReady(order.id, item.id));

  // 5. Expedição e entrega ao garçom
  console.log('\n🚀 5. Comanda 100% pronta! Despachando para entrega na Mesa 08:');
  kitchen.dispatchOrder(order.id);

  console.log('\n✨ Operação concluída com tempos de SLA cumpridos!');
}

main().catch(console.error);
