const { botToken } = require('./config/botConfig');
// получаем доступ к менеджеру системы доступа к файлам и папкам
const {
    idQueryWordsArr,
    greetengsWordsArr,
    commonQuestionArr,
} = require('./controllers/commonPhrases');

const { banWordsArr } = require('./controllers/banWords');

const {
    getGiftKeyboard,
    isGiftUsefulKeyboard,
    isAgreeGetMessagesKeyboard,
    mainKeyboard,
} = require('./config/keyboards');

const { video1, video2, video3 } = require('./config/videoConfig');

// импортируем необходимые функции из модуля функций
const {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    makeInlineKeyboardFromArr,
    findWords,
    findExpression,
    checkAbortAggreToGetMessages,
} = require('./utilites');

// импортируем необходимый нам класс Bot из основной библиотеки grammy.js, а также классы обработчиков ошибок GrammyError и HttpError
const { Bot, GrammyError, Context, session, HttpError } = require('grammy');

// импортируем библиотеки с диалогами
const { conversations, createConversation } = require('@grammyjs/conversations');

const bot = new Bot(botToken);

// активируем возможность бота поддерживать режим беседы
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

// активируем беседу по сбору информации о клиенте
bot.use(createConversation(clientIdentify));
bot.api.setMyCommands([
    {
        command: 'start',
        description: 'Запустить бота',
    },
]);

bot.command('start', async (ctx) => {
    ctx.session.clientInfo = await clientVerification(ctx);
    // если клиент уже есть в базе, то отправляем приветствие с учетом его имени
    if (ctx.session.clientInfo) {
        let clientName = ctx.session.clientInfo.client_name;
        await ctx.reply(
            `👋 ${clientName}, добрый день! Рады, что вы заглянули в наш магазин ювелирной бижутерии By A&K`,
            {
                parse_mode: 'HTML',
            }
        );
        await ctx.reply('Выберите интересующий вас контент👇', {
            reply_markup: mainKeyboard,
            parse_mode: 'HTML',
        });
    } else {
        await ctx.reply(
            'Привет, красотка! Рады, что ты заглянула в магазин модной бижутерии By A&K.',
            {
                parse_mode: 'HTML',
            }
        );
        await ctx.conversation.enter('clientIdentify');
    }
});

bot.on('callback_query:data', async (ctx) => {
    ctx.session.clientInfo = await clientVerification(ctx);

    let timeoutId;
    // Обработчик нажатия на кнопку "Забрать подарок"
    if (ctx.callbackQuery.data === 'getGift') {
        try {
            await ctx.reply('Секундочку...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(video1);

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                ctx.reply('Обязательно попробуй этот макияж сделать сама. У тебя получится!', {
                    reply_markup: mainKeyboard,
                    parse_mode: 'HTML',
                });

                timeoutId = setTimeout(() => {
                    ctx.reply(
                        `Лови ссылку на инсту <a href="https://www.instagram.com/samarinavisage?igsh=MTQ0YWdyZjA2NWd4aQ==">Самариной Лилии</a>. Загляни, у нее море классного контента.`,
                        { reply_markup: mainKeyboard, parse_mode: 'HTML' }
                    );

                    if (ctx.session.clientInfo) {
                        timeoutId = setTimeout(() => {
                            ctx.reply(
                                `${ctx.session.clientInfo.client_name}, тебе понравился подарок?`,
                                {
                                    reply_markup: isGiftUsefulKeyboard,
                                    parse_mode: 'HTML',
                                }
                            );
                        }, 30000);
                    }
                }, 5000);
            }, 60000);
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (ctx.callbackQuery.data === 'isUseful') {
        if (ctx.session.clientInfo) {
            await ctx.reply(
                `Оставь пожалуйста отзыв о том, что подарок был действительно полезен.`,
                {
                    parse_mode: 'HTML',
                }
            );
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (ctx.session.clientInfo) {
                timeoutId = setTimeout(async () => {
                    await ctx.reply(
                        `А тебе было бы интересно получать уведомления о наших новинках?`,
                        {
                            reply_markup: isAgreeGetMessagesKeyboard,
                            parse_mode: 'HTML',
                        }
                    );
                }, 20000);
            }
        }
    } else if (ctx.callbackQuery.data === 'isNotUseful') {
        if (ctx.session.clientInfo) {
            await ctx.reply(`А тебе было бы интересно получать уведомления о наших новинках?`, {
                reply_markup: isAgreeGetMessagesKeyboard,
                parse_mode: 'HTML',
            });
        }
    } else if (ctx.callbackQuery.data === 'isAgreeGetMessages') {
        if (ctx.session.clientInfo) {
            await ctx.react('👌');
            await ctx.reply(
                `Большое спасибо! Будем и дальше стараться делать только полезный контент!`,
                {
                    parse_mode: 'HTML',
                }
            );
        }
    } else if (ctx.callbackQuery.data === 'isNotAgreeGetMessages') {
        if (ctx.session.clientInfo) {
            await ctx.react('👌');
            await ctx.reply(`Спасибо за уделённое время!😃`, {
                parse_mode: 'HTML',
            });
            await checkAbortAggreToGetMessages(ctx.session.clientInfo.client_tg_id);
        }
    }
    // Удаление клавиатуры
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
});

// Ответ бота на команды, которые не нашлись в коде
bot.on('message', async (ctx) => {
    let timeoutId;
    const message = ctx.message.text;

    if (message == 'Тройная подвеска') {
        try {
            // Очищаем предыдущий таймаут, если он существует
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Добавляем реакцию через некоторое время (например, 2 секунды)
            timeoutId = setTimeout(async () => {
                await ctx.react('👌');
            }, 2000);

            await ctx.reply(
                'Мне тоже нравится эта бижутерия! Немножко подождите пока ищу для вас контент...',
                {
                    parse_mode: 'HTML',
                }
            );

            await ctx.replyWithVideo(video1);
            await ctx.reply('Отличный выбор! Особенно для вечерних нарядов!', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (message == 'Арабская подвеска') {
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // Добавляем реакцию через некоторое время (например, 2 секунды)
        timeoutId = setTimeout(async () => {
            await ctx.react('❤️');
        }, 2000);
        // если мы хотим удалить предыдущее сообщение
        // await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        try {
            await ctx.reply('Отличный выбор. Уже передаю вам видео...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(video2);
            await ctx.reply('Почувствуй себя арабской принцессой', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (message == 'Кольцо') {
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // Добавляем реакцию через некоторое время (например, 2 секунды)
        timeoutId = setTimeout(async () => {
            await ctx.react('😍');
        }, 2000);
        // если мы хотим удалить предыдущее сообщение
        // await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);

        try {
            await ctx.reply('Кольца - это моя слабость! Секундочку...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(video3);
            await ctx.reply('Красивое кольцо безусловно подчеркнёт вашу индивидуальность', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (findExpression(idQueryWordsArr, message.toLowerCase())) {
        // обрабатываем команды на запрос id
        await ctx.reply(`Ваш id: ${ctx.from.id}`, {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
    } else if (findExpression(greetengsWordsArr, message.toLowerCase())) {
        await ctx.react('🤗');
        await ctx.reply('Добрый день! Чем я могу вам помочь?', {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
    } else if (findExpression(commonQuestionArr, message.toLowerCase())) {
        await ctx.react('👍');
        await ctx.reply('У меня всё отлично! Спасибо!', {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
        await ctx.reply(
            'Кстати, на следующей неделе привезём новые позиции из последних топовых коллекций!'
        );
    } else if (findWords(banWordsArr, message.toLowerCase())) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        const sentMessage = await ctx.reply('Ругаемся?');
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(async () => {
            await ctx.api.deleteMessage(ctx.chat.id, sentMessage.message_id);
        }, 2000);
    }

    // обрабатываем нераспознанные команды
    else {
        await ctx.reply(`Не могу распознать ваш вопрос!`);
    }
});

async function clientIdentify(conversation, ctx) {
    // Начинаем с вопроса о имени
    await askForName(conversation, ctx);
}

// теперь запустим нашего бота, но он пока не реагирует на команды пользователя, поэтому надо добавить соответствующий код на коменду start (выше добавлен)
bot.start();

// --------------------------
// функция запрашивает имя пользователя при первичной аутентификации
async function askForName(conversation, ctx) {
    await ctx.reply('Как я могу к тебе обращаться? Напиши свое имя...', {
        parse_mode: 'HTML',
    });
    const clientNameObj = await conversation.wait();
    ctx.session.clientName = clientNameObj.update.message.text;
    await askForCity(conversation, ctx);
}

// функция запрашивает город и при необходимости может возвращать клиента назад к вопросу об имени
async function askForCity(conversation, ctx) {
    await ctx.reply('Из какого ты города?', {
        parse_mode: 'HTML',
    });
    const cityObj = await conversation.wait();
    const foundCity = await findCity(cityObj.update.message.text.trim());
    console.log('Осуществлен поиск по городам: ', foundCity);

    if (foundCity.length === 1) {
        ctx.session.clientCity = foundCity[0].city_name;
        await addClientToDB(ctx);
        await ctx.reply(
            `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
            {
                reply_markup: getGiftKeyboard,
                parse_mode: 'HTML',
            }
        );
    } else if (foundCity.length > 1) {
        await ctx.reply('Уточни пожалуйста город', {
            parse_mode: 'HTML',
            reply_markup: makeInlineKeyboardFromArr(foundCity, 'city_name'),
        });
        const callbackQuery = await conversation.wait();
        if (callbackQuery.update.callback_query) {
            const selectedCity = callbackQuery.update.callback_query.data;

            if (selectedCity === 'abort') {
                await ctx.reply('Давай вернемся к предыдущему вопросу!');
                await askForName(conversation, ctx); // Снова спрашиваем имя
            } else {
                ctx.session.clientCity = selectedCity; // Записываем выбранный город в сессию
                await addClientToDB(ctx);
                await ctx.reply(
                    `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
                    {
                        reply_markup: getGiftKeyboard,
                        parse_mode: 'HTML',
                    }
                );
            }
        }
    } else {
        // если город не нашелся в списке, то добавляем город в БД, а потом записываем клиента
        ctx.session.clientCity = cityObj.update.message.text.trim();
        await addNewCityToDB(ctx);
        await addClientToDB(ctx);
        await ctx.reply(
            `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
            {
                reply_markup: getGiftKeyboard,
                parse_mode: 'HTML',
            }
        );
    }
}
