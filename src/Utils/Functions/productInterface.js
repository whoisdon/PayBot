import { EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import generateQRCode from '../../Utils/Functions/generateQRCode.cjs';

const filter = async (i) => await i.deferUpdate().catch(() => { })

const cancelPaymentMessages = async (interaction, channel, firebase) => {
    let messagesDeleted;
    do {
        const messages = await channel.messages.fetch({ limit: 100 });
        const botMessages = messages.filter((msg) => msg.author.bot);

        if (botMessages.size === 0) {
            break; 
        }

        const messageIds = botMessages.map((msg) => msg.id);

        await Promise.all(botMessages.map(async (msg) => {
            const cache = msg.embeds[0].data;
            const stockAgo = parseInt(cache.fields?.find(field => field.name === 'Quantidade').value.replaceAll('`', ''));

            const m = (await firebase.ref(`User/${interaction.user.id}/Products/${channel.id}/${msg.id}`).once('value')).val();
            if (!m) return;

            const targetChannel = interaction.guild.channels.cache.get(m.channelId);
            const targetMessage = await targetChannel.messages.fetch(m.messageId);
            const mCache = targetMessage.embeds[0].data;
            const size = parseInt(mCache.fields.find(field => field.name === 'Quantidade restante').value.replaceAll('`', ''));

            mCache.fields.find(field => field.name === 'Quantidade restante').value = `\`${size + stockAgo}\``;

            await targetMessage.edit({ embeds: [mCache] });
        }));

        messagesDeleted = botMessages.size;
        await channel.bulkDelete(messageIds).catch(() => {});
    } while (messagesDeleted > 0);
};

const bulkDeleteWithTitles = async (channel) => {
    let titles = [];
  
    let messagesDeleted;
    do {
        const messages = await channel.messages.fetch({ limit: 100 });
        const botMessages = messages.filter((msg) => msg.author.bot);

        titles = titles.concat(botMessages.map((msg) => {
            const embed = msg.embeds[0];
            if (embed) {
                const fields = embed.fields;
                const sizeField = fields?.find(field => field.name === 'Quantidade');
                const priceField = fields?.find(field => field.name === 'Valor');
                
                const size = sizeField ? sizeField.value : null;
                const price = priceField ? priceField.value.replace(/`/g, '') : null;
                const product = embed.title;

                if (size !== null && price !== null) {
                    return { price, size, product };
                }
            }
            return null;
        }));
  
        messagesDeleted = await channel.bulkDelete(botMessages).catch(() => { });
    } while (messagesDeleted?.size > 0);
  
    return titles.filter(Boolean); 
};

const totalMoney = (push) => {
    try {
        return Object.values(push).reduce((acc, obj) => {
            const moneyValue = parseFloat(obj.money.replace('R$', '').replace(',', '.'));
            return acc + moneyValue;
        }, 0);
    } catch (_) {
        return null;
    }
}

export const removeItem = async ({ interaction, firebase }) => {
    const push = (await firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}/${interaction.message.id}`).once('value')).val();
    const channel = interaction.guild.channels.cache.get(push.channelId);
    const message = await channel.messages.fetch(push.messageId);
    const cache = message.embeds[0].data;
    const stockAgo = parseInt(cache.fields?.find(field => field.name === 'Quantidade restante')?.value.replaceAll('`', ''));

    const messageAlt = interaction.message.embeds[0].data;
    const atl = parseInt(messageAlt.fields?.find(field => field.name === 'Quantidade')?.value)

    const fieldIndex = cache.fields.findIndex(field => field.name === 'Quantidade restante');
    cache.fields[fieldIndex].value = `\`${stockAgo + atl}\``;

    await message.edit({ embeds: [cache] });
    interaction.message.delete().catch(() => {  });

    firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}/${interaction.message.id}`).remove();
}

export const addItem = async ({ interaction, firebase }) => {
    var cache = interaction.message.embeds[0].data;
    const stockAgo = parseInt(cache.fields?.find(field => field.name === 'Quantidade restante')?.value.replaceAll('`', ''));
    const price = cache.fields?.find(field => field.name === 'Valor')?.value.replaceAll('`', '');
      
    if (stockAgo <= 0) {
        interaction.reply({ content: '❌ **|** Este produto está fora de estoque.', ephemeral: true });
        return;
    }

    const channel = interaction.guild.channels.cache.find(c => c.name === `🛒│${interaction.user.username}`);
    const image = cache.image?.url || cache.thumbnail?.url || null; 
    const stock = cache.fields?.find(field => field.name === 'Valor');

    const embed = new EmbedBuilder()
    .setThumbnail(image)
    .setTitle(cache.title)
    .addFields(
        { name: stock.name, value: stock.value, inline: true },
        { name: 'Quantidade', value: '1', inline: true }
    )

    const fieldIndex = cache.fields.findIndex(field => field.name === 'Quantidade restante');
    cache.fields[fieldIndex].value = `\`${stockAgo - 1}\``;

    interaction.message.edit({ embeds: [cache] });

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('add-item-modals')
        .setEmoji('➕')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('reduce-item-modals')
        .setEmoji('➖')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('remove-item')
        .setEmoji('🗑️')
        .setStyle('Danger')
    )

    if (!channel) {   
        const create = await interaction.guild.channels.create({
            name: `🛒│${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [{
                id: interaction.guild.id,
                deny: ['ViewChannel']
            },
            {
                id: interaction.user.id,
                allow: ['ViewChannel', 'SendMessages', 'AddReactions', 'ReadMessageHistory'],
            }]
        });

        interaction.reply({ content: `✅ **|** Produto adicionado ao carrinho. Veja em ${create}`, ephemeral: true })
        
        const init = new EmbedBuilder()
        .setDescription('Ao concluir todas as modificações nos produtos mencionados, siga em frente e clique no botão "Ir para pagamento" para finalizar sua compra e garantir a entrega dos itens escolhidos.')
        .setTitle(`Carrinho de ${interaction.user.username}`)
        .setColor('#248046')

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setLabel('Ir para pagamento')
            .setStyle('Success')
            .setCustomId('go-to-payment')
            .setEmoji('✅'),
            new ButtonBuilder()
            .setLabel('Cancelar compra')
            .setStyle('Danger')
            .setCustomId('cancel-payment')
            .setEmoji('✖️')
        )

        create.send({ embeds: [init], components: [btn] })
        create.send({ embeds: [embed], components: [button] }).then((m) => {
            firebase.ref(`User/${interaction.user.id}/Products/${create.id}/${m.id}`).update({
                messageId: interaction.message.id,
                channelId: interaction.channel.id,
                money: price
            })
        })
        return;
    }


    interaction.reply({ content: `✅ **|** Produto adicionado ao carrinho. Veja em ${channel}`, ephemeral: true })
    channel.send({ embeds: [embed], components: [button] }).then((m) => {
        firebase.ref(`User/${interaction.user.id}/Products/${channel.id}/${m.id}`).update({
            messageId: interaction.message.id,
            channelId: interaction.channel.id,
            money: price
        })
    })
}

export const goToPayment = async ({ interaction, firebase }) => {
    const push = (await firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}`).once('value')).val();
    
    if (!push) {
        interaction.reply({ content: '❌ **|** Você não tem produtos no carrinho.', ephemeral: true });
        return;
    }

    interaction.update({});
    bulkDeleteWithTitles(interaction.channel).then(async (c) => {
        let total = 0;

        for (const item of c) {
            const priceString = item.price;
            const numericString = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(numericString);
            
            if (!isNaN(price)) {
                total += price;
            }
        }

        let resultString = '```';

        for (const item of c) {
            const priceString = item.price;
            const numericString = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(numericString);
            
            if (!isNaN(price)) {
                resultString += `\nProduto: ${item.product} | Quantidade: ${item.size}`;
            }
        }

        resultString += '```';

        const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTitle(':money_with_wings: | Compra de Rifas')
        .setDescription(`> Realize o **pagamento** e envie o **comprovante** neste chat. Após isso, **aguarde** até que o dono etre em **contato** atráves deste ticket.

> Chave-Pix: **${process.env.CHAVE_PIX}**
> Nome: **${process.env.NOME}**
> Banco: **${process.env.BANCO}**`)
        .setFooter({ text: `${interaction.guild.name} © Todos os direitos reservados`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setColor('#ff0000')

        const emd = new EmbedBuilder()
        .setTitle(`Prezado(a) ${interaction.user.username},`)
        .setDescription(`Para garantir um atendimento ainda mais ágil e eficiente, agora aceitamos pagamentos através do PIX! Entretanto, para agilizar o processamento do seu pedido, solicitamos que, após realizar o pagamento via PIX, gentilmente envie o comprovante de pagamento neste chat.
                
Nossa equipe estará pronta para verificar seu pagamento e prosseguir com o processamento do seu pedido. Por favor, aguarde a confirmação de um dos nossos colaboradores antes de prosseguir.
                
Agradecemos pela sua compreensão e cooperação.
                
Atenciosamente, Administração.`)
        .setColor('#ff0000')

        interaction.channel.send({ files: [await generateQRCode(interaction, totalMoney(total))], embeds: [emd, embed] }).then(() => {
            interaction.channel.send({ content: resultString });
            firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}`).remove();
        })
    })
}

export const addItemModals = async ({ interaction, firebase }) => {
    let quantidade = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
        .setStyle(TextInputStyle.Short)
        .setLabel('Quantidade de Rifas')
        .setCustomId('placeholder-size-raspadinha')
        .setPlaceholder('Qual a quantidade de rifas que deseja comprar?')
        .setRequired(true)
    )

    const modal = new ModalBuilder()
    .setCustomId('modal-add-raspadinha')
    .setTitle('Adicionar Rifas')
    .addComponents([quantidade]);

    interaction.showModal(modal);

    interaction.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const number = parseInt(interaction.fields.getTextInputValue('placeholder-size-raspadinha'))
        
        if (isNaN(number)) return interaction.channel.send({ content: '❌ **|** O valor inserido não é um número.', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
        if (number <= 0) return interaction.channel.send({ content: '❌ **|** O valor inserido não pode ser menor ou igual a 0.', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));

        const m = (await firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}/${interaction.message.id}`).once('value')).val();
        const channel = interaction.guild.channels.cache.get(m.channelId);
        const message = await channel.messages.fetch(m.messageId);
        const cache = message.embeds[0].data;
        const size = cache.fields.find(field => field.name === 'Quantidade restante').value.replaceAll('`', '');

        if (number > parseInt(size)) return interaction.channel.send({ content: '❌ **|** O valor inserido é maior que a quantidade do estoque.', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));

        const fieldIndex = cache.fields.findIndex(field => field.name === 'Quantidade restante');
        cache.fields[fieldIndex].value = `\`${parseInt(size) - number}\``;

        await message.edit({ embeds: [cache] });

        const atualCache = interaction.message.embeds[0].data;
        const atl = parseInt(atualCache.fields.find(field => field.name === 'Quantidade').value);
        const money = m.money.replace('R$', '').replace(',', '.');

        const atlfieldIndex = atualCache.fields.findIndex(field => field.name === 'Quantidade');
        atualCache.fields[atlfieldIndex].value = `${atl + number}`;

        const atualizedIndex = atualCache.fields.find(field => field.name === 'Quantidade').value;

        const valfieldIndex = atualCache.fields.findIndex(field => field.name === 'Valor');
        const formattedMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(money) * atualizedIndex);

        atualCache.fields[valfieldIndex].value = `\`${formattedMoney}\``;

        await interaction.editReply({ embeds: [atualCache] })
    }).catch(() => { })
}

export const reduceItemModals = async ({ interaction, firebase }) => {
    let quantidade = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
        .setStyle(TextInputStyle.Short)
        .setLabel('Quantidade de Rifas')
        .setCustomId('placeholder-size-raspadinha')
        .setPlaceholder('Qual a quantidade de rifas que deseja remover?')
        .setRequired(true)
    )

    const modal = new ModalBuilder()
    .setCustomId('modal-remover-raspadinha')
    .setTitle('Remover Rifas')
    .addComponents([quantidade]);

    interaction.showModal(modal);

    interaction.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const number = parseInt(interaction.fields.getTextInputValue('placeholder-size-raspadinha'))
        
        if (isNaN(number)) return interaction.channel.send({ content: '❌ **|** O valor inserido não é um número.', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
        if (number <= 1) return interaction.channel.send({ content: '❌ **|** O valor inserido não pode ser menor ou igual a 1.', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
       
        const cache = interaction.message.embeds[0].data;
        const stockAgo = parseInt(cache.fields.find(field => field.name === 'Quantidade').value.replaceAll('`', ''));

        if (number > stockAgo) return interaction.channel.send({ content: '❌ **|** Você não pode remover a quantidade de rifas que não tem adicionada!', ephemeral: true }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
        
        const m = (await firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}/${interaction.message.id}`).once('value')).val();
        const channel = interaction.guild.channels.cache.get(m.channelId);
        const message = await channel.messages.fetch(m.messageId);
        const mCache = message.embeds[0].data;
        const size = mCache.fields.find(field => field.name === 'Quantidade restante').value.replaceAll('`', '');

        const quantidadeAdicionada = parseInt(size) + number;

        const fieldIndex = mCache.fields.findIndex(field => field.name === 'Quantidade restante');
        mCache.fields[fieldIndex].value = `\`${quantidadeAdicionada}\``;

        await message.edit({ embeds: [mCache] });

        const atualCache = interaction.message.embeds[0].data;
        const atl = parseInt(atualCache.fields.find(field => field.name === 'Quantidade').value);
        const money = m.money.replace('R$', '').replace(',', '.');

        const quantidadeSubtraida = atl - number;

        const atlfieldIndex = atualCache.fields.findIndex(field => field.name === 'Quantidade');
        atualCache.fields[atlfieldIndex].value = `${quantidadeSubtraida}`;

        const formattedMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(money) * quantidadeSubtraida);

        const valfieldIndex = atualCache.fields.findIndex(field => field.name === 'Valor');
        atualCache.fields[valfieldIndex].value = `\`${formattedMoney}\``;

        await interaction.editReply({ embeds: [atualCache] });
    }).catch(() => { })
}

export const cancelPayment = async ({ interaction, firebase }) => {
    interaction.update({}).catch(() => {}).then(async () => {
        await cancelPaymentMessages(interaction, interaction.channel, firebase);
        await firebase.ref(`User/${interaction.user.id}/Products/${interaction.channel.id}`).remove();
        await interaction.channel.delete().catch(() => {});
    });
};
