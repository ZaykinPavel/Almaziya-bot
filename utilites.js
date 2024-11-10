const {
    isGiftUsefulKeyboard,
    isAgreeGetMessagesKeyboard,
    mainKeyboard,
} = require('./config/keyboards');

const { giftVideo } = require('./config/videoConfig');

const { addClientToDB, addNewCityToDB, findCity } = require('./controllers/operationsWithDB'); // импорт необходимых функций из модуля БД
const { getGiftKeyboard } = require('./config/keyboards'); // импорт необходимых клавиатур
const { unitMessages, commonMessages, registrationMessages } = require('./controllers/messages');

// функция проверяет есть ли в сообщении любое слово из заданного массива
const findWords = (arr, message) => {
    const containsWord = arr.some((word) => message.includes(word));
    return containsWord;
};

// функция строит инлайн-клавиатуру на основании массива
const makeInlineKeyboardFromArr = (arr, fieldName) => {
    const keyboard = [];
    // строим кнопки на основании полученного массива
    arr.forEach((item) => {
        keyboard.push([
            {
                text: item[fieldName],
                callback_data: item[fieldName], // или любое другое значение для callback_data
            },
        ]);
    });
    // Обработка кнопки возврата
    keyboard.push([
        {
            text: 'Назад ↩️',
            callback_data: 'abort', // или любое другое значение для callback_data
        },
    ]);
    return {
        inline_keyboard: keyboard,
    };
};

// функция проверяет сообщение на точное совпадение с любым выражением из массива
const findExpression = (arr, message) => {
    let isContain = false;
    arr.forEach((word) => {
        if (message == word) {
            isContain = true;
            return;
        }
    });
    return isContain;
};

const setTotalClientsInMessage = (stat) => {
    return `${stat.totalClients.number_of_clients}`;
};

const setTotalAgreeClientsInMessage = (stat) => {
    return `<b>Согласие на рассылку:</b>\nСогласны: ${stat.agreeClients[0].total}\nНе согласны: ${stat.agreeClients[1].total}`;
};

const setPeriodRegistrationInMessage = (stat) => {
    return `<b>Зарегистрировались:</b>\nВ текущем месяце: ${getCurrentMonthData(
        stat.createdPeriod
    )}\nВ прошлом месяце: ${getPreviousMonthData(stat.createdPeriod)}`;
};

const setPeriodLastVisitInMessage = (stat) => {
    return `<b>Последнее посещение:</b>\nВ текущем месяце: ${getCurrentMonthData(
        stat.lastVisitPeriod
    )}\nВ прошлом месяце: ${getPreviousMonthData(stat.lastVisitPeriod)}`;
};

function getCurrentMonthData(data) {
    // Получаем текущую дату
    const now = new Date();
    // Форматируем текущий месяц и год в 'YYYY-MM'
    const currentYearMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
    const filteredData = data.filter((item) => item.year_month === currentYearMonth);
    if (filteredData.length > 0) {
        return filteredData[0].total;
    } else {
        return '0';
    }
}

function getPreviousMonthData(data) {
    // Получаем текущую дату
    const now = new Date();
    // Уменьшаем месяц на 1 для получения прошлого месяца
    now.setMonth(now.getMonth() - 1);
    // Форматируем прошлый месяц и год в 'YYYY-MM'
    const previousYearMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'

    // Фильтруем данные по прошлому месяцу
    const filteredData = data.filter((item) => item.year_month === previousYearMonth);

    // Возвращаем total или '0', если данные отсутствуют
    if (filteredData.length > 0) {
        return filteredData[0].total;
    } else {
        return '0';
    }
}

const setStatisticByClientsCityInMessage = (stat) => {
    let str = '<b>Распределение по городам:</b>\n';
    for (let i = 0; i < stat.clientsByCities.length; ++i) {
        str = `${str}${stat.clientsByCities[i].city}: ${stat.clientsByCities[i].clients_by_city} чел.\n`;
    }
    return str;
};

async function sendGift(ctx) {
    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
    await ctx.reply(commonMessages.waiting, { parse_mode: 'HTML' });
    await ctx.replyWithVideo(giftVideo);
    const motivatingMessageTimeout = setTimeout(async () => {
        await ctx.reply(unitMessages.introUnitMessages.prepareGift.text, {
            reply_markup: mainKeyboard,
            parse_mode: 'HTML',
        });
        const sentInstagramTimeout = setTimeout(async () => {
            await ctx.reply(unitMessages.introUnitMessages.sharePartnerLink.text, {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
            if (ctx.session.clientInfo) {
                const isGiftUsefulTimeout = setTimeout(() => {
                    ctx.reply(
                        unitMessages.introUnitMessages.doYouLikeTheGift.text(
                            ctx.session.clientInfo.client_name
                        ),
                        {
                            reply_markup: isGiftUsefulKeyboard,
                            parse_mode: 'HTML',
                        }
                    );
                    clearTimeout(isGiftUsefulTimeout);
                }, unitMessages.introUnitMessages.doYouLikeTheGift.delay);
            }
            clearTimeout(sentInstagramTimeout);
        }, unitMessages.introUnitMessages.sharePartnerLink.delay);
        clearTimeout(motivatingMessageTimeout);
    }, unitMessages.introUnitMessages.prepareGift.delay);
}

async function requestFeedback(ctx) {
    await ctx.reply(unitMessages.introUnitMessages.getFeedbackText, {
        parse_mode: 'HTML',
    });
    const feedbackTimeout = setTimeout(() => {
        ctx.reply(unitMessages.introUnitMessages.getAgreeText, {
            reply_markup: isAgreeGetMessagesKeyboard,
            parse_mode: 'HTML',
        });
        clearTimeout(feedbackTimeout);
    }, 20000);
}

async function sendContentToClient(ctx, video, emoji, introMessage, outroMessage, promoMessage) {
    await ctx.react(emoji);
    await ctx.reply(introMessage, { parse_mode: 'HTML' });
    await ctx.replyWithVideo(video);
    await ctx.reply(outroMessage, { parse_mode: 'HTML' });
    const promoTimeout = setTimeout(async () => {
        await ctx.reply(promoMessage, { reply_markup: mainKeyboard, parse_mode: 'HTML' });
        clearTimeout(promoTimeout);
    }, 5000);
}

// Функция для запроса имени
async function askForName(conversation, ctx) {
    while (true) {
        await ctx.reply(registrationMessages.getNameText, {
            parse_mode: 'HTML',
        });

        const clientNameObj = await conversation.wait();
        const clientTextName = clientNameObj.update.message.text;

        if (clientTextName === '/start') {
            await ctx.reply(registrationMessages.getNameAgainText, {
                parse_mode: 'HTML',
            });
        } else {
            ctx.session.clientName = clientTextName;
            await askForCity(conversation, ctx);
            break; // выходим из цикла, если имя корректное
        }
    }
}

// Функция для запроса города
async function askForCity(conversation, ctx) {
    try {
        await ctx.reply(registrationMessages.getCityText, { parse_mode: 'HTML' });

        const cityObj = await conversation.wait();
        const cityName = cityObj.update.message.text.trim();

        const foundCity = await findCity(cityName);
        console.log('Осуществлен поиск по городам: ', foundCity);

        if (!foundCity) {
            await ctx.reply(registrationMessages.cityNotFindText);
            return await askForCity(conversation, ctx); // Повторный запрос города
        }

        if (foundCity.length === 1) {
            ctx.session.clientCity = foundCity[0].city_name;
            try {
                await addClientToDB(ctx);
                await ctx.reply(
                    unitMessages.introUnitMessages.takeGiftText(ctx.session.clientName),
                    { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                );
            } catch (error) {
                console.error('Ошибка при добавлении клиента в БД:', error);
                await ctx.reply(registrationMessages.errorSaveClientToDBText);
            }
        } else if (foundCity.length > 1) {
            await ctx.reply(registrationMessages.getCityAgainText, {
                parse_mode: 'HTML',
                reply_markup: makeInlineKeyboardFromArr(foundCity, 'city_name'),
            });

            const callbackQuery = await conversation.wait();
            if (callbackQuery.update.callback_query) {
                const selectedCity = callbackQuery.update.callback_query.data;

                if (selectedCity === 'abort') {
                    await ctx.reply(registrationMessages.abortLastQuestuionText);
                    return await askForName(conversation, ctx); // Возвращаемся к вопросу об имени
                } else {
                    ctx.session.clientCity = selectedCity;
                    try {
                        await addClientToDB(ctx);
                        await ctx.reply(
                            unitMessages.introUnitMessages.takeGiftText(ctx.session.clientName),
                            { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                        );
                    } catch (error) {
                        console.error('Ошибка при добавлении клиента в БД:', error);
                        await ctx.reply(registrationMessages.errorSaveClientToDBText);
                    }
                }
            }
        } else {
            ctx.session.clientCity = cityName;
            try {
                await addNewCityToDB(ctx);
                await addClientToDB(ctx);
                await ctx.reply(
                    unitMessages.introUnitMessages.takeGiftText(ctx.session.clientName),
                    { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                );
            } catch (error) {
                console.error('Ошибка при добавлении нового города или клиента в БД:', error);
                await ctx.reply(registrationMessages.errorSaveClientToDBText);
            }
        }
    } catch (error) {
        console.error('Ошибка в процессе запроса города:', error);
        await ctx.reply(registrationMessages.underfinedErrorText);
    }
}

async function safelyEditMessageReplyMarkup(ctx, newMarkup) {
    try {
        const currentMarkup = ctx.callbackQuery.message.reply_markup || { inline_keyboard: [] };

        // Проверка на идентичность текущей и новой разметки
        if (JSON.stringify(currentMarkup) !== JSON.stringify(newMarkup)) {
            await ctx.editMessageReplyMarkup(newMarkup);
        }
    } catch (error) {
        // Игнорируем ошибку, если причина — отсутствие изменений в разметке
        if (!error.message.includes('message is not modified')) {
            console.error('Ошибка при редактировании разметки сообщения:', error.message);
        }
    }
}

// Экспортируем функцию
module.exports = {
    makeInlineKeyboardFromArr,
    findWords,
    findExpression,
    setTotalClientsInMessage,
    setStatisticByClientsCityInMessage,
    setPeriodRegistrationInMessage,
    setTotalAgreeClientsInMessage,
    setPeriodLastVisitInMessage,
    sendGift,
    requestFeedback,
    sendContentToClient,
    askForName,
    askForCity,
    safelyEditMessageReplyMarkup,
};
