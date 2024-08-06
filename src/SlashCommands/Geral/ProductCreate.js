import SlashCommands from '../../Structure/SlashCommands.js';
import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { unifyProduct, unifyProductButton, ActionRowTitle, ActionRowDescription, ActionRowColor, ActionRowAuthor, ActionRowPrice, ActionRowImageThumbnail, ActionRowFooter, ActionRowStock, ActionRowJsonExport, ActionRowJsonImport, ActionRowSuccess } from '../../Utils/Functions/unifyProduct.js';

export default class extends SlashCommands {
  constructor(client) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName('criar')
        .setDescription('[Moderação] Crie um produto para ser vendido no servidor.')
        .addSubcommand(subcommand => subcommand
          .setName('produto')
          .setDescription('[Moderação] Crie um produto para ser vendido no servidor.')  
          .addChannelOption(option => option
            .setName('canal')
            .setDescription('[Canal] Canal onde o produto será enviado.') 
          )
        )
    });
  }

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    const message = await interaction.reply({ embeds: [unifyProduct], components: unifyProductButton, fetchReply: true })

    const filter = (i) => {
      if (i.user.id !== interaction.user.id) {
        i.reply({ content: 'Você não pode interagir com este botão!', ephemeral: true });
        return;
      }
      return true;
    };
    const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button });

    collector.on('collect', i => {
      const mash = {
        'button-title': () => ActionRowTitle(i),
        'button-description': () => ActionRowDescription(i),
        'button-color': () => ActionRowColor({ i, quickdb: this.quickdb }),
        'button-author': () => ActionRowAuthor(i),
        'button-price': () => ActionRowPrice(i),
        'button-image-thumbnail': () => ActionRowImageThumbnail(i),
        'button-footer': () => ActionRowFooter(i),
        'button-stock': () => ActionRowStock(i),
        'json-export': () => ActionRowJsonExport(i),
        'json-import': () => ActionRowJsonImport(i),
        'success-send': () => ActionRowSuccess(i, channel)
      }

      mash[i.customId]();
    });
  }
}
