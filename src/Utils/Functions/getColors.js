import 'colors';

export default function log(message, type) {
  const colorFormat = {
    error: `${'❌'.red} ${'fatal'.red.underline}  `,
    system: `${'🔵'.blue} ${'system'.blue.underline} `,
    success: `${'✔️'.green}  ${'success'.green.underline}`,
    client: `${'⬜'.magenta} ${'client'.magenta.underline} `,
    notice: `${'🔔'.yellow} ${'notice'.yellow.underline} `
  };

  console.log(`${colorFormat[type]}      ${message}`);
}
