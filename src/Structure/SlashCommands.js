import { PermissionFlagsBits } from 'discord.js';

class SlashCommands {
  constructor(client, options) {
    this.client = client;
    this.name = options.name || options.data.name;
    this.description = options.description || options.data.description;
    this.options = options.options || options.data?.options;
    this.userPermissions = options.userPermissions;
    this.botPermissions = options.botPermissions || [PermissionFlagsBits.SendMessages]; 
    this.onlyDevs = options?.onlyDevs || false;
    this.deferReply = options.deferReply || false;
    this.guildCollection = options.guildCollection; 
    this.emoji = this.client.emoji;
    this.log = this.client.log;
    this.quickdb = this.client.quickdb;
    this.firebase = this.client.firebase;
  }
  
  toJSON() {
    // eslint-disable-next-line no-unused-vars
    const { client, botPermissions, userPermissions, quickdb, firebase, ...data } = this;
    return data;
  }
}

export default SlashCommands;
