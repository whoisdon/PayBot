import EventMap from '../../Structure/EventMap.js';
import { removeItem, addItem, goToPayment, addItemModals, reduceItemModals, cancelPayment } from '../../Utils/Functions/productInterface.js';

export default class extends EventMap {
  constructor(client) {
    super(client, {
      name: 'interactionCreate'
    });
  }
  run = async (interaction) => {
    if (!interaction.isButton()) return;

    const actions = {
        'square-cart': addItem,
        'remove-item': removeItem,
        'add-item-modals': addItemModals,
        'reduce-item-modals': reduceItemModals,
        'go-to-payment': goToPayment,
        'cancel-payment': cancelPayment
    };

    const action = actions[interaction.customId];

    if (action) {
        action({ interaction, firebase: this.firebase });
    }
  }
}
