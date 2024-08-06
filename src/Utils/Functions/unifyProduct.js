import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { loadImage } from "canvas";

var filter = async (i) => await i.deferUpdate().catch(() => { });

const replace = (str, i) => {
    return str.replace('{user.username}', i.user.username)
    .replace('{user.tag}', i.user.tag)
    .replace('{user.id}', i.user.id)
    .replace('{user.mention}', i.user)
    .replace('{guild.name}', i.guild.name)
    .replace('{guild.id}', i.guild.id)
    .replace('{channel.name}', i.channel.name)
    .replace('{channel.id}', i.channel.id)
    .replace('{client.name}', i.client.user.username)
    .replace('{guild.image}', i.guild.iconURL({ extension: 'png', dynamic: true }))
    .replace('{client.image}', i.client.user.displayAvatarURL({ extension: 'png', dynamic: true }))
}

const verifyLink = async (link) => {
    try {
        const response = await axios.head(link);
        const status = response.status;
        return status >= 200 && status < 300 ? link : null;
    } catch (error) {
        return null;
    }
};     

const verifyImage = async (url) => {
    try {
        await loadImage(url);
        return url;
    } catch (error) {
        return null;
    }
}

export const unifyProduct = new EmbedBuilder()
.setTitle('Personalize abaixo')
.setDescription('Lembre-se que seu embed não pode ser vazio!')
.setColor('#313338')

export const unifyProductButton = [
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('button-title')
        .setLabel('Título')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-description')
        .setLabel('Descrição')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-color')
        .setLabel('Cor')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-author')
        .setLabel('Autor')
        .setStyle('Secondary')
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('button-price')
        .setLabel('Definir Preço')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-stock')
        .setLabel('Definir Estoque')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-image-thumbnail')
        .setLabel('Imagem e Thumbnail')
        .setStyle('Secondary'),
        new ButtonBuilder()
        .setCustomId('button-footer')
        .setLabel('Rodapé')
        .setStyle('Secondary')
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('json-import')
        .setLabel('Importar JSON')
        .setStyle('Primary')
        .setEmoji('<:import:1205606529974141008>'),
        new ButtonBuilder()
        .setCustomId('json-export')
        .setLabel('Exportar JSON')
        .setStyle('Primary')
        .setEmoji('<:export:1205605999206076527>'),
        new ButtonBuilder()
        .setCustomId('success-send')
        .setLabel('Enviar')
        .setStyle('Success')
        .setEmoji('<:success:1205610836681293874>')
    )
]

export const ActionRowTitle = async (i) => {
    var cache = i.message.embeds[0].data;

    let titleInput = new TextInputBuilder()
    .setValue(cache.title)
    .setMaxLength(256)
    .setLabel('Título')
    .setCustomId('placeholder-title')
    .setPlaceholder('Qual será o título do seu Embed')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1);

    let urlInput = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Url do título')
    .setCustomId('placeholder-url')
    .setPlaceholder('Ao clicar no título o usuário será redirecionado.')
    .setRequired(false);

    if (cache?.url) {
        urlInput.setValue(cache.url);
    }

    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const urlRow = new ActionRowBuilder().addComponents(urlInput);

    const modal = new ModalBuilder()
    .setCustomId('modal-title')
    .setTitle('Altere o título do seu Embed.')
    .addComponents([titleRow, urlRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const title = interaction.fields.getTextInputValue('placeholder-title');
        const url = interaction.fields.getTextInputValue('placeholder-url') || null;   
        const embed = new EmbedBuilder(cache).setTitle(title).setURL(await verifyLink(url))

        await interaction.editReply({ embeds: [embed] });
        return;
    }).catch(() => { })
  
}

export const ActionRowDescription = async (i) => {
    var cache = i.message.embeds[0].data;

    let descriptionInput = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
        .setValue(cache.description)
        .setMaxLength(4000)
        .setLabel('Descrição')
        .setCustomId('placeholder-description')
        .setPlaceholder('Qual será a descrição do seu Embed')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
    )

    const modal = new ModalBuilder()
    .setCustomId('modal-description')
    .setTitle('Altere a descrição do seu Embed.')
    .addComponents([descriptionInput]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const description = interaction.fields.getTextInputValue('placeholder-description');
        const embed = new EmbedBuilder(cache).setDescription(replace(description, interaction))

        await interaction.editReply({ embeds: [embed] });
        return;
    }).catch(() => {})
}

export const ActionRowColor = async ({ i, quickdb }) => {
    var cache = i.message.embeds[0].data;
    const color = await quickdb.get(`Config/Color/${i.message.id}`) || '#313338';

    let colorInput = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
        .setValue(`${color}`)
        .setMaxLength(7)
        .setMinLength(7)
        .setLabel('Cor')
        .setCustomId('placeholder-color')
        .setPlaceholder('Qual será a cor do seu Embed (hexadecimal ex: #FFFFFF)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )

    const modal = new ModalBuilder()
    .setCustomId('modal-color')
    .setTitle('Altere a cor do seu Embed.')
    .addComponents([colorInput]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        try {
            const color = interaction.fields.getTextInputValue('placeholder-color') || null;
            const embed = new EmbedBuilder(cache).setColor(color)

            await quickdb.set(`Config/Color/${i.message.id}`, color)

            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (_) {
            return;
        }
    }).catch(() => { })
}

export const ActionRowAuthor = async (i) => {
    var cache = i.message.embeds[0].data;

    let image = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Imagem do Cabeçalho')
    .setCustomId('placeholder-header-image')
    .setPlaceholder('Qual será a imagem do seu cabeçalho do seu Embed.')
    .setRequired(false);

    let url = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Url do Cabeçalho')
    .setCustomId('placeholder-header-url')
    .setPlaceholder('Ao clicar no cabeçalho o usuário será redirecionado.')
    .setRequired(false);

    let header = new TextInputBuilder()
    .setMaxLength(256)
    .setLabel('Cabeçalho')
    .setCustomId('placeholder-header')
    .setPlaceholder('Qual será a descrição do cabeçalho do seu Embed.')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setRequired(true);

    if (cache.author?.icon_url) {
        image.setValue(cache.author.icon_url);
    }

    else if (cache.author?.url) {
        url.setValue(cache.author.url);
    }

    else if (cache.author?.name) {
        header.setValue(cache.author.name);
    }

    const imageRow = new ActionRowBuilder().addComponents(image);
    const urlRow = new ActionRowBuilder().addComponents(url);
    const headerRow = new ActionRowBuilder().addComponents(header);

    const modal = new ModalBuilder()
    .setCustomId('modal-author')
    .setTitle('Altere o cabeçalho do seu Embed.')
    .addComponents([imageRow, urlRow, headerRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const image = interaction.fields.getTextInputValue('placeholder-header-image');
        const replaceImage = await verifyImage(replace(image, interaction)) || null;
        const url = await verifyLink(interaction.fields.getTextInputValue('placeholder-header-url')) || null;
        const header = interaction.fields.getTextInputValue('placeholder-header');

        const embed = new EmbedBuilder(cache).setAuthor({ name: header, url: url, iconURL: replaceImage })

        await interaction.editReply({ embeds: [embed] });
    }).catch(() => {})
}

export const ActionRowPrice = async (i) => {
    var cache = i.message.embeds[0].data;

    let priceInput = new TextInputBuilder()
    .setLabel('Descrição')
    .setCustomId('placeholder-price')
    .setPlaceholder('Qual será o valor do seu produto?')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setRequired(true)
    .setValue('R$ 0,00')

    const priceAgo = cache.fields?.find(field => field.name === 'Valor')?.value

    if (priceAgo) {
        priceInput.setValue(priceAgo.replaceAll('`', ''));
    }

    const priceRow = new ActionRowBuilder().addComponents(priceInput);

    const modal = new ModalBuilder()
    .setCustomId('modal-price')
    .setTitle('Altere o valor do seu Produto.')
    .addComponents([priceRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const price = interaction.fields.getTextInputValue('placeholder-price');
        const embed = new EmbedBuilder(cache);
        
        let fieldIndex = -1;
        if (embed.data.fields && embed.data.fields.length > 0) {
            fieldIndex = embed.data.fields.findIndex(field => field.name === 'Valor');
        }
    
        if (fieldIndex !== -1) {
            embed.data.fields[fieldIndex].value = `\`${price}\``;
        } else {
            embed.addFields({
                name: 'Valor',
                value: `\`${price}\``,
                inline: true
            });
        }
    
        await interaction.editReply({ embeds: [embed] });
    }).catch(() => { })
}

export const ActionRowImageThumbnail = async (i) => {
    var cache = i.message.embeds[0].data;

    let image = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Imagem')
    .setCustomId('placeholder-image')
    .setPlaceholder('Qual será a imagem do seu Embed.')
    .setRequired(false);

    let thumbnail = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Thumbnail')
    .setCustomId('placeholder-thumbnail')
    .setPlaceholder('Qual será a thumbnail do seu Embed.')
    .setRequired(false);

    if (cache.thumbnail?.url) {
        thumbnail.setValue(cache.thumbnail.url);
    }

    if (cache.image?.url) {
        image.setValue(cache.image.url);
    }

    const imageRow = new ActionRowBuilder().addComponents(image);
    const thumbnailRow = new ActionRowBuilder().addComponents(thumbnail);

    const modal = new ModalBuilder()
    .setCustomId('modal-author')
    .setTitle('Altere o cabeçalho do seu Embed.')
    .addComponents([imageRow, thumbnailRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const image = interaction.fields.getTextInputValue('placeholder-image')
        const thumbnail = interaction.fields.getTextInputValue('placeholder-thumbnail')
        const replaceImage = await verifyImage(replace(image, interaction)) || null;
        const replaceThumbnail = await verifyImage(replace(thumbnail, interaction)) || null;

        const embed = new EmbedBuilder(cache).setImage(replaceImage).setThumbnail(replaceThumbnail);

        await interaction.editReply({ embeds: [embed] });
    }).catch(() => { })
}

export const ActionRowFooter = async (i) => {
    var cache = i.message.embeds[0].data;

    let footer = new TextInputBuilder()
    .setStyle(TextInputStyle.Paragraph)
    .setLabel('Texto do Rodapé')
    .setCustomId('placeholder-footer-text')
    .setPlaceholder('Qual será o texto do rodapé do seu Embed.')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(2048)

    let icon = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Imagem do Rodapé')
    .setCustomId('placeholder-footer-image')
    .setPlaceholder('Qual será a imagem do rodapé do seu Embed.')
    .setRequired(false);

    if (cache.footer?.icon_url) {
        icon.setValue(cache.footer.icon_url);
    }

    else if (cache.footer?.text) {
        footer.setValue(cache.footer.text);
    }

    const footerRow = new ActionRowBuilder().addComponents(footer);
    const iconRow = new ActionRowBuilder().addComponents(icon);

    const modal = new ModalBuilder()
    .setCustomId('modal-footer')
    .setTitle('Altere o cabeçalho do seu Embed.')
    .addComponents([footerRow, iconRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const footer = interaction.fields.getTextInputValue('placeholder-footer-text')
        const image = interaction.fields.getTextInputValue('placeholder-footer-image');
        const replaceImage = await verifyImage(replace(image, interaction)) || null;

        const embed = new EmbedBuilder(cache).setFooter({ text: footer, iconURL: replaceImage })

        await interaction.editReply({ embeds: [embed] });
    }).catch(() => { })
}

export const ActionRowStock = async (i) => {
    var cache = i.message.embeds[0].data;

    let stock = new TextInputBuilder()
    .setStyle(TextInputStyle.Short)
    .setLabel('Quantidade em Estoque')
    .setCustomId('placeholder-stock')
    .setPlaceholder('Qual será a quantidade em estoque do seu Produto?')
    .setRequired(true)

    const stockAgo = cache.fields?.find(field => field.name === 'Quantidade restante')?.value

    if (stockAgo) {
        stock.setValue(stockAgo.replaceAll('`', ''));
    }

    const stockRow = new ActionRowBuilder().addComponents(stock);

    const modal = new ModalBuilder()
    .setCustomId('modal-stock')
    .setTitle('Altere o stock do seu Produto.')
    .addComponents([stockRow]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        const stock = interaction.fields.getTextInputValue('placeholder-stock');
        const embed = new EmbedBuilder(cache);

        let fieldIndex = -1;
        if (embed.data.fields && embed.data.fields.length > 0) {
            fieldIndex = embed.data.fields.findIndex(field => field.name === 'Quantidade restante');
        }  
        
        if (fieldIndex !== -1) {
            embed.data.fields[fieldIndex].value = `\`${stock}\``;
        } else {
            embed.addFields({
                name: 'Quantidade restante',
                value: `\`${stock}\``,
                inline: true
            });
        }
    
        await interaction.editReply({ embeds: [embed] });
        return;
    }).catch(() => { })
}

export const ActionRowJsonImport = async (i) => {
    let json = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
        .setStyle(TextInputStyle.Paragraph)
        .setLabel('Importar JSON')
        .setCustomId('placeholder-json-import')
        .setPlaceholder('Qual o JSON a ser importado?')
        .setRequired(true)
        .setMinLength(1)
    )

    const modal = new ModalBuilder()
    .setCustomId('modal-json')
    .setTitle('Importe um JSON para o seu Embed.')
    .addComponents([json]);

    i.showModal(modal);

    i.awaitModalSubmit({ time: 60000, filter }).then(async interaction => {
        try {
            const json = interaction.fields.getTextInputValue('placeholder-json-import');
            const embed = new EmbedBuilder(JSON.parse(json));
        
            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (_) {
            return;
        }
    }).catch(() => { })
}

export const ActionRowJsonExport = async (i) => {
    const cache = i.message.embeds[0].data;
    const json = JSON.stringify(cache);

    i.reply({ embeds: [new EmbedBuilder().setDescription(json)] })
    return;
}

export const ActionRowSuccess = async (i, channel) => {
    const cache = i.message.embeds[0].data;

    const priceAgo = cache.fields?.find(field => field.name === 'Valor').value
    const stockAgo = cache.fields?.find(field => field.name === 'Quantidade restante')?.value

    if (!priceAgo) {
        i.reply({ content: `❌ **|** ${i.user} Você precisa adicionar um preço ao seu produto!`, ephemeral: true });
        return;
    }

    else if (!stockAgo) {
        i.reply({ content: `❌ **|** ${i.user} Você precisa adicionar um estoque ao seu produto!`, ephemeral: true });
        return;
    }

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('square-cart')
        .setLabel('Adicionar ao Carrinho')
        .setEmoji('<:square_cart:1205617362703749150>')
        .setStyle('Secondary')
    )

    channel.send({ embeds: [new EmbedBuilder(cache)], components: [button] })
    i.reply({ content: '✔️ **|** Embed enviada com sucesso!', ephemeral: true })
    return;
}
