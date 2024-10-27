const { botToken, admIds } = require('./config/botConfig');
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
    adminKeyboard,
    returnKeyboard,
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
    getStatistic,
    setTotalClientsInMessage,
    setStatisticByClientsCityInMessage,
    setPeriodRegistretionInMessage,
    setTotalAgreeClientsInMessage,
} = require('./utilites');

// импортируем необходимый нам класс Bot из основной библиотеки grammy.js, а также классы обработчиков ошибок GrammyError и HttpError
const { Bot, GrammyError, Context, session, HttpError } = require('grammy');

// импортируем библиотеки с диалогами
const { conversations, createConversation } = require('@grammyjs/conversations');
// создаем класс бота
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

// обработка стартовой команды бота
bot.command('start', async (ctx) => {
    await handleStartCommand(ctx);
});

// обработка основных команд и сообщений бота
bot.on('message', async (ctx) => {
    await handleIncomingMessage(ctx);
});

bot.on('callback_query:data', async (ctx) => {
    await handleCallbackQuery(ctx);
});

// теперь запустим нашего бота, но он пока не реагирует на команды пользователя, поэтому надо добавить соответствующий код на коменду start (выше добавлен)
bot.start();

async function handleIncomingMessage(ctx) {
    const message = ctx.message.text.toLowerCase();
    if (message === 'тройная подвеска') {
        await sendJewelryContent(
            ctx,
            video1,
            '👌',
            'Мне тоже нравится эта бижутерия! Немножко подождите пока ищу для вас контент...',
            'Отличный выбор! Особенно для вечерних нарядов!'
        );
    } else if (message === 'арабская подвеска') {
        await sendJewelryContent(
            ctx,
            video2,
            '❤️',
            'Отличный выбор. Уже передаю вам видео...',
            'Почувствуй себя арабской принцессой'
        );
    } else if (message === 'кольцо') {
        await sendJewelryContent(
            ctx,
            video3,
            '😍',
            'Кольца - это моя слабость! Секундочку...',
            'Красивое кольцо безусловно подчеркнёт вашу индивидуальность'
        );
    } else if (findExpression(idQueryWordsArr, message)) {
        await ctx.reply(`Ваш id: ${ctx.from.id}`);
    } else if (findExpression(greetengsWordsArr, message)) {
        await ctx.react('🤗');
        await ctx.reply('Добрый день! Чем я могу вам помочь?');
    } else if (findExpression(commonQuestionArr, message)) {
        await ctx.react('👍');
        await ctx.reply('У меня всё отлично! Спасибо!');
        await ctx.reply(
            'Кстати, на следующей неделе привезём новые позиции из последних топовых коллекций!'
        );
    } else if (findWords(banWordsArr, message)) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        const sentMessage = await ctx.reply('Ругаемся?');
        const findBanWordTimeout = setTimeout(() => {
            ctx.api.deleteMessage(ctx.chat.id, sentMessage.message_id);
            clearTimeout(findBanWordTimeout);
        }, 2000);
    } else {
        await ctx.reply(`Не могу распознать ваш вопрос!`);
    }
    if (ctx.session.isMassMailing) {
        ctx.session.draftMessage = ctx.message.text; // Сохраняем введенное сообщение
        const statObj = await getStatistic();
        await ctx.reply(
            `ПОДТВЕРЖДЕНИЕ РАССЫЛКИ\nБудет отправлено следующее сообщение:\n--------------\n<b>${
                ctx.session.draftMessage
            }</b>\n--------------\nСообщение получат: ${setTotalClientsInMessage(
                statObj
            )} клиентов.\n\n Подтверждаете рассылку?`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Подтвердить', callback_data: 'confirmMassMailing' }],
                    ],
                },
                parse_mode: 'HTML',
            }
        );
    }
}

async function sendJewelryContent(ctx, video, emoji, introMessage, outroMessage) {
    await ctx.react(emoji);
    await ctx.reply(introMessage, { parse_mode: 'HTML' });
    await ctx.replyWithVideo(video);
    await ctx.reply(outroMessage, { reply_markup: mainKeyboard, parse_mode: 'HTML' });
}

async function handleStartCommand(ctx) {
    ctx.session.clientInfo = await clientVerification(ctx);
    if (ctx.session.clientInfo) {
        const clientName = ctx.session.clientInfo.client_name;
        if (admIds.includes(ctx.from.id)) {
            await ctx.reply(
                `👋 ${clientName}, привет! Как администратору бота тебе доступны специальные функции 👇`,
                {
                    reply_markup: adminKeyboard,
                    parse_mode: 'HTML',
                }
            );
        } else {
            await ctx.reply(
                `👋 ${clientName}, добрый день! Рады, что вы заглянули в наш магазин ювелирной бижутерии By A&K`,
                { parse_mode: 'HTML' }
            );
            await ctx.reply('Выберите интересующий вас контент👇', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        }
    } else {
        await ctx.reply(
            'Привет, красотка! Рады, что ты заглянула в магазин модной бижутерии By A&K.',
            { parse_mode: 'HTML' }
        );
        await ctx.conversation.enter('clientIdentify');
    }
}

async function clientIdentify(conversation, ctx) {
    // Начинаем с вопроса о имени
    await askForName(conversation, ctx);
}

async function handleCallbackQuery(ctx) {
    ctx.session.clientInfo = await clientVerification(ctx);
    const action = ctx.callbackQuery.data;

    try {
        switch (action) {
            case 'getGift':
                await sendGift(ctx);
                break;
            case 'isUseful':
                await requestFeedback(ctx);
                break;
            case 'isNotUseful':
            case 'isNotAgreeGetMessages':
                await ctx.reply('Спасибо за уделённое время!😃', { parse_mode: 'HTML' });
                if (action === 'isNotAgreeGetMessages') {
                    await checkAbortAggreToGetMessages(ctx.session.clientInfo.client_tg_id);
                }
                break;
            case 'isAgreeGetMessages':
                await ctx.reply(
                    'Большое спасибо! Будем и дальше стараться делать только полезный контент!',
                    { parse_mode: 'HTML' }
                );
                break;

            case 'getStatistic':
                await ctx.reply(`Секундочку...`, {
                    parse_mode: 'HTML',
                });
                const statObj = await getStatistic();
                console.log(statObj);
                if (statObj) {
                    await ctx.reply(
                        `СТАТИСТИКА\n---------------\nВсего клиентов: ${setTotalClientsInMessage(
                            statObj
                        )} чел.\n---------------\n${setStatisticByClientsCityInMessage(
                            statObj
                        )}\n${setTotalAgreeClientsInMessage(
                            statObj
                        )}\n\n${setPeriodRegistretionInMessage(statObj)}`,
                        { parse_mode: 'HTML', reply_markup: adminKeyboard }
                    );
                } else {
                    await ctx.reply(`База данных пока пустая!`, {
                        parse_mode: 'HTML',
                        reply_markup: adminKeyboard,
                    });
                }

                break;
            case 'massMailing':
                // Удаляем предыдущее сообщение, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                }
                const massMailingMessage = await ctx.reply('Введи текст сообщения...', {
                    reply_markup: returnKeyboard,
                });
                ctx.session.massMailingMessageId = massMailingMessage.message_id; // Сохраняем ID сообщения
                ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                break;
            case 'adminKeyboard':
                // Удаляем сообщение массовой рассылки, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                    ctx.session.massMailingMessageId = null; // Сбрасываем ID после удаления
                }
                await ctx.reply('Возвращаемся в главное меню...', {
                    parse_mode: 'HTML',
                    reply_markup: adminKeyboard,
                });
                break;
            default:
                console.log(`Неизвестное действие: ${action}`);
                break;
        }
    } catch (error) {
        console.error('Ошибка при обработке callback запроса:', error.message);
        await ctx.answerCallbackQuery({
            text: 'Произошла ошибка. Попробуйте позже.',
            show_alert: true,
        });
    } finally {
        // Проверяем, есть ли сообщение для редактирования
        if (ctx.session.massMailingMessageId) {
            try {
                await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
            } catch (error) {
                console.error('Ошибка при редактировании сообщения:', error.message);
            }
        }
    }
}

async function sendGift(ctx) {
    await ctx.reply('Секундочку...', { parse_mode: 'HTML' });
    await ctx.replyWithVideo(video1);
    const motivatingMessageTimeout = setTimeout(async () => {
        await ctx.reply('Обязательно попробуй этот макияж сделать сама. У тебя получится!', {
            reply_markup: mainKeyboard,
            parse_mode: 'HTML',
        });
        const sentInstagramTimeout = setTimeout(async () => {
            await ctx.reply(
                `Лови ссылку на инсту <a href="https://www.instagram.com/samarinavisage?igsh=MTQ0YWdyZjA2NWd4aQ==">Самариной Лилии</a>. Загляни, у нее море классного контента.`,
                { reply_markup: mainKeyboard, parse_mode: 'HTML' }
            );
            if (ctx.session.clientInfo) {
                const isGiftUsefulTimeout = setTimeout(() => {
                    ctx.reply(`${ctx.session.clientInfo.client_name}, тебе понравился подарок?`, {
                        reply_markup: isGiftUsefulKeyboard,
                        parse_mode: 'HTML',
                    });
                    clearTimeout(isGiftUsefulTimeout);
                }, 20000);
            }
            clearTimeout(sentInstagramTimeout);
        }, 5000);
        clearTimeout(motivatingMessageTimeout);
    }, 40000);
}

async function requestFeedback(ctx) {
    await ctx.reply(
        'Мы будем рады, если ты оставишь отзыв в карточке товара на WB. В отзыве напиши какой контент был бы тебе полезен!💖💖💖',
        {
            parse_mode: 'HTML',
        }
    );
    const feedbackTimeout = setTimeout(() => {
        ctx.reply('А тебе было бы интересно получать уведомления о наших новинках?', {
            reply_markup: isAgreeGetMessagesKeyboard,
            parse_mode: 'HTML',
        });
        clearTimeout(feedbackTimeout);
    }, 20000);
}

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
