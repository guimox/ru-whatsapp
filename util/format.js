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

const insertDisclaimer = (formattedOutput, link) => {
  formattedOutput += '🌱 - Indicado para veganos\n';
  formattedOutput += '🥩 - Contém produtos de origem animal\n';
  formattedOutput += '🌾 - Não indicado para celíacos por conter glúten\n';
  formattedOutput +=
    '🥛 - Não indicado para intolerantes à lactose por conter lactose\n';
  formattedOutput += '🍳 - Contém ovo\n';
  formattedOutput += '⚠️ - Contém produto(s) alergênico(s)\n';
  formattedOutput += '🍯 - Contém mel\n';
  formattedOutput += '🌶️ - Contém pimenta\n';
  formattedOutput += `\n_Cardápio retirado de forma automatizada do site oficial do restaurante universitário. Essa mensagem e esse canal não possuem relação com a universidade ou com o restaurante universitário._ \n\n${link}`;
  return formattedOutput;
};

module.exports = { insertDisclaimer, formatDate, translateTitle };
