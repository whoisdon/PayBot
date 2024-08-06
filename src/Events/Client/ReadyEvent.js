import EventMap from '../../Structure/EventMap.js';
import '../../Utils/Functions/createMosaic.js';

export default class extends EventMap {
  constructor(client) {
    super(client, {
      name: 'ready',
      once: true
    });
  }
  run = async () => {
    await this.client.registerCommands();
    this.log(`O client ${`${this.client.user.tag}`.black} ${`(${this.client.user.id})`.black} foi iniciado com êxito!`, 'client');
  }
}
