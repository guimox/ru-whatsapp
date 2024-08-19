const { daysOfWeek } = require('./constants');
const { insertDisclaimer, formatDate } = require('./format');

const formatMeals = (jsonData) => {
  const dateFromJson = jsonData.date;
  const title = jsonData.ruName;
  const link = jsonData.ruUrl;

  const dayOfWeek = daysOfWeek[new Date(dateFromJson).getDay()];

  let formattedOutput = '';

  if (title) {
    formattedOutput += `*CARDÁPIO RU ${title} - ${dayOfWeek} - ${formatDate(dateFromJson)}*\n\n`;
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

  let completeMessage = insertDisclaimer(formattedOutput);

  return completeMessage;
};

module.exports = { formatMeals };
