const translateTitle = (title) => {
  switch (title) {
    case 'breakfast':
      return '*CAFÉ DA MANHÃ*';
    case 'lunch':
      return '*ALMOÇO*';
    case 'dinner':
      return '*JANTAR*';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

const insertDisclaimer = (formattedOutput, link, channelUrl) => {
  formattedOutput += '🌱 - Indicado para veganos\n';
  formattedOutput += '🥩 - Contém produtos de origem animal\n';
  formattedOutput += '🐷 - Contém produtos de origem suína\n';
  formattedOutput += '🥛 - Contém leite e/ou derivados\n';
  formattedOutput += '🍳 - Contêm ovos\n';
  formattedOutput += '🌾 - Contém glúten\n';
  formattedOutput += '⚠️ - Contém produto(s) alergênico(s)\n';
  formattedOutput += '🍯 - Contém mel\n';
  formattedOutput += '🌶️ - Contém pimenta\n';
  formattedOutput += `\nCardápio retirado de forma automatizada do site oficial do restaurante universitário disponível no link ${link}.\n`;
  formattedOutput += `\nEssa mensagem foi enviada ao canal de WhatsApp disponível no link ${channelUrl}.\n`;
  formattedOutput += `\nEssa mensagem e esse canal não possuem relação com a universidade ou com o restaurante universitário.`;
  return formattedOutput;
};

module.exports = { insertDisclaimer, formatDate, translateTitle };
