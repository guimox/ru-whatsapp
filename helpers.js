const formatMeals = (jsonData) => {
  const iconsMap = {
    'Simbolo-vegano-300x300': '🌱',
    'Origem-animal-site': '🥩',
    'Gluten-site': '🌾',
    'Leite-e-derivados-site': '🥛',
    'Ovo-site': '🍳',
    'Simbolo-pimenta-300x300': '🌶️',
  };

  const daysOfWeek = [
    'DOMINGO',
    'SEGUNDA',
    'TERÇA',
    'QUARTA',
    'QUINTA',
    'SEXTA',
    'SÁBADO',
  ];

  function translateTitle(title) {
    switch (title) {
      case 'breakfast':
        return '*CAFÉ DA MANHÃ*';
      case 'lunch':
        return '*ALMOÇO*';
      case 'dinner':
        return '*JANTAR*';
    }
  }

  const formattedDate = new Date(jsonData.date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const dayOfWeek = daysOfWeek[new Date(jsonData.date).getDay()];

  let formattedOutput = '';

  const title = jsonData.ruName;
  const link = jsonData.ruUrl;

  if (title) {
    formattedOutput += `*CARDÁPIO RU ${title} - ${dayOfWeek} - ${formattedDate}*\n\n`;
  }

  for (const mealType of jsonData.served) {
    formattedOutput += translateTitle(mealType) + '\n';

    for (const meal of jsonData.meals[mealType]) {
      formattedOutput += `${meal.name} ${meal.icons
        .map((icon) => iconsMap[icon])
        .join(' ')}\n`;
    }

    formattedOutput += '\n';
  }

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

module.exports = { formatMeals };
