const { PIX } = require('gpix/dist');
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

const generateQRCode = async (interaction, size) => {
  const pix = PIX.static().setReceiverName(interaction.user.username)
    .setReceiverCity('Brasil')
    .setKey(process.env.CHAVE_PIX)
    .setDescription(`Valor a pagar R$${size.toFixed(2)}`)
    .setAmount(+size)

    const canvas = createCanvas(200, 200);
    const context = canvas.getContext('2d');
    const qrCodeImage = await loadImage(await pix.getQRCode());
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(qrCodeImage, 0, 0, canvas.width, canvas.height);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'qrcode.png' });

    return attachment;
}

module.exports = generateQRCode;
