const { botToken, admIds } = require('./config/botConfig');

const { Unit_1_Sculptor, video2, video3 } = require('./config/videoConfig');

const {
    unitMessages,
    commonMessages,
    banMessages,
    massMailingMessages,
    idQueryWordsArr,
    greetingsWordsArr,
    commonQuestionArr,
} = require('./controllers/messages');

const { banWordsArr } = require('./controllers/banWords');

const {
    getGiftKeyboard,
    mainKeyboard,
    adminKeyboard,
    returnKeyboard,
    confirmMassMailingKeyboard,
    stopMassMailingKeyboard,
} = require('./config/keyboards');
// импортируем необходимые функции из модуля функций
const {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    checkAbortAggreToGetMessages,
    getStatistic,
    updateClientLastVisit,
    getAllClientsFromDB,
} = require('./controllers/operationsWithDB');

// импортируем необходимые функции из модуля функций
const {
    makeInlineKeyboardFromArr,
    setTotalClientsInMessage,
    setStatisticByClientsCityInMessage,
    setPeriodRegistrationInMessage,
    setTotalAgreeClientsInMessage,
    setPeriodLastVisitInMessage,
    sendGift,
    requestFeedback,
    findExpression,
    findWords,
    sendContentToClient,
} = require('./utilites');

// импортируем необходимый нам класс Bot из основной библиотеки grammy.js, а также классы обработчиков ошибок GrammyError и HttpError
const { Bot, GrammyError, session, HttpError } = require('grammy');

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

bot.on('callback_query', async (ctx) => {
    await handleCallbackQuery(ctx);
});

// теперь запустим нашего бота, но он пока не реагирует на команды пользователя, поэтому надо добавить соответствующий код на коменду start (выше добавлен)
bot.start();

async function handleStartCommand(ctx) {
    ctx.session.clientInfo = await clientVerification(ctx);
    if (ctx.session.clientInfo) {
        const clientName = ctx.session.clientInfo.client_name;
        if (admIds.includes(ctx.from.id)) {
            await updateClientLastVisit(ctx);
            await ctx.reply(
                `👋 ${clientName}, привет! Как администратору бота тебе доступны специальные функции 👇`,
                {
                    reply_markup: adminKeyboard,
                    parse_mode: 'HTML',
                }
            );
        } else {
            await updateClientLastVisit(ctx);
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
        await updateClientLastVisit(ctx);
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
                await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
                await requestFeedback(ctx);
                break;
            case 'isNotUseful':
            case 'isNotAgreeGetMessages':
                await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
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
                        )}\n\n${setPeriodRegistrationInMessage(
                            statObj
                        )}\n\n${setPeriodLastVisitInMessage(statObj)}`,
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
                await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
                await ctx.reply('Возвращаемся в главное меню...', {
                    parse_mode: 'HTML',
                    reply_markup: adminKeyboard,
                });
                break;
            case 'confirmMassMailing':
                await startMassmailing(ctx);
                ctx.session.attachment = null;
                break;
            case 'stopMassMailing':
                ctx.session.isMassMailing = false; // Устанавливаем флаг остановки
                await ctx.reply('Массовая рассылка принудительно остановлена.');
                // Пробуем изменить разметку только если это необходимо
                await ctx.reply('Меню администратора', {
                    reply_markup: adminKeyboard,
                    parse_mode: 'HTML',
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

async function startMassmailing(ctx) {
    // Уведомляем пользователя о начале рассылки
    const massMailingMessage = await ctx.reply(massMailingMessages.startMassMailing, {
        reply_markup: stopMassMailingKeyboard,
    });

    const textForMassMailing = ctx.session.draftMessage || ''; // Если нет текста, устанавливаем пустую строку
    const attachment = ctx.session.attachment;

    const clientsForMailing = await getAllClientsFromDB();
    console.log(
        'Получатели:',
        clientsForMailing,
        'Текст рассылки:',
        textForMassMailing,
        'Вложение:',
        attachment
    );

    // функционал массовой рассылки сообщения
    for (const client of clientsForMailing) {
        if (!ctx.session.isMassMailing) {
            await ctx.reply(massMailingMessages.stopMassMailing.stopMessage);
            await ctx.reply(massMailingMessages.stopMassMailing.afterStopMessage, {
                reply_markup: adminKeyboard,
                parse_mode: 'HTML',
            });
            return; // Выходим из функции, если рассылка остановлена
        }

        const { clienttgid, clientname } = client;

        // Преобразуем clienttgid в число
        const chatId = parseInt(clienttgid, 10);
        if (isNaN(chatId)) {
            console.error(`Некорректный client_tg_id для клиента ${clientname}: ${clienttgid}`);
            continue; // Пропускаем клиента с некорректным ID
        }

        try {
            // Проверяем наличие текста, чтобы избежать подписи undefined
            const options = textForMassMailing
                ? { caption: textForMassMailing, parse_mode: 'HTML' }
                : {};

            if (attachment) {
                // Проверяем тип вложения и отправляем соответствующее сообщение
                switch (attachment.type) {
                    case 'photo':
                        await bot.api.sendPhoto(chatId, attachment.file_id, options);
                        break;
                    case 'video':
                        await bot.api.sendVideo(chatId, attachment.file_id, options);
                        break;
                    case 'document':
                        await bot.api.sendDocument(chatId, attachment.file_id, options);
                        break;
                    case 'audio':
                        await bot.api.sendAudio(chatId, attachment.file_id, options);
                        break;
                    case 'voice':
                        await bot.api.sendVoice(chatId, attachment.file_id, options);
                        break;
                    case 'sticker':
                        await bot.api.sendSticker(chatId, attachment.file_id);
                        break;
                    default:
                        console.error(`Неизвестный тип вложения: ${attachment.type}`);
                }
            } else {
                // Отправляем только текст, если вложение отсутствует
                await bot.api.sendMessage(chatId, textForMassMailing, {
                    parse_mode: 'HTML',
                });
            }

            console.log(`Сообщение отправлено клиенту ${clientname} (ID: ${chatId})`);
        } catch (error) {
            console.error(
                `Не удалось отправить сообщение клиенту ${clientname} (ID: ${chatId}):`,
                error
            );
        }

        // Интервал между отправками
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('Массовая рассылка завершена.');
    // Завершение рассылки

    ctx.session.isMassMailing = false; // Сбрасываем флаг

    await ctx.reply(massMailingMessages.endMassMailing, {
        reply_markup: adminKeyboard,
        parse_mode: 'HTML',
    });
}

async function handleIncomingMessage(ctx) {
    // проверяем, в какой форме приходит сообщение
    const message = (ctx.message.text || ctx.message.caption || '').toLowerCase();

    if (message === 'урок 1. скульптор') {
        await sendContentToClient(
            ctx,
            Unit_1_Sculptor,
            unitMessages.sculptor.reaction,
            unitMessages.sculptor.loadingText,
            unitMessages.sculptor.successText
        );
    } else if (message === 'арабская подвеска') {
        await sendContentToClient(
            ctx,
            video2,
            unitMessages.unit2.reaction,
            unitMessages.unit2.loadingText,
            unitMessages.unit2.successText
        );
    } else if (message === 'кольцо') {
        await sendContentToClient(
            ctx,
            video3,
            unitMessages.unit3.reaction,
            unitMessages.unit3.loadingText,
            unitMessages.unit3.successText
        );
    } else if (findExpression(idQueryWordsArr, message)) {
        await ctx.reply(`Ваш id: ${ctx.from.id}`);
    } else if (findExpression(greetingsWordsArr, message)) {
        await ctx.react(commonMessages.greetings.reaction);
        await ctx.reply(commonMessages.greetings.reply);
    } else if (findExpression(commonQuestionArr, message)) {
        await ctx.react(commonMessages.commonQuestion.reaction);
        await ctx.reply(commonMessages.commonQuestion.reply);
        await ctx.reply(commonMessages.commonQuestion.postReply);
    } else if (findWords(banWordsArr, message)) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        const sentMessage = await ctx.reply(banMessages.warning);
        const findBanWordTimeout = setTimeout(() => {
            ctx.api.deleteMessage(ctx.chat.id, sentMessage.message_id);
            clearTimeout(findBanWordTimeout);
        }, 2000);
    } else if (ctx.session.isMassMailing) {
        // Если отправляется сообщение, то получаем сообщение, а если вложение к картинке или видосу, то текст вложения
        ctx.session.draftMessage = ctx.message.text ? ctx.message.text : ctx.message.caption;
        // Проверка на наличие вложений и ограничение на одно вложение
        if (ctx.session.attachment) {
            await ctx.reply(massMailingMessages.singleAttachmentOnly);
            return; // Прекращаем выполнение функции, если вложение уже есть
        }
        // Проверяем наличие вложений
        if (ctx.message.photo) {
            ctx.session.attachment = { type: 'photo', file_id: ctx.message.photo[0].file_id };
        } else if (ctx.message.document) {
            ctx.session.attachment = { type: 'document', file_id: ctx.message.document.file_id };
        } else if (ctx.message.video) {
            ctx.session.attachment = { type: 'video', file_id: ctx.message.video.file_id };
        } else if (ctx.message.audio) {
            ctx.session.attachment = { type: 'audio', file_id: ctx.message.audio.file_id };
        } else if (ctx.message.voice) {
            ctx.session.attachment = { type: 'voice', file_id: ctx.message.voice.file_id };
        } else if (ctx.message.sticker) {
            ctx.session.attachment = { type: 'sticker', file_id: ctx.message.sticker.file_id };
        }

        const statObj = await getStatistic();
        await ctx.reply(
            `ПОДТВЕРЖДЕНИЕ РАССЫЛКИ\nБудет отправлено следующее сообщение:\n--------------\n<b>${
                ctx.session.draftMessage
                    ? ctx.session.draftMessage
                    : '(Отправка вложения без текста)'
            }</b>\n--------------\nСообщение получат: ${setTotalClientsInMessage(
                statObj
            )} клиентов.\n\n Подтверждаете рассылку?`,
            {
                reply_markup: confirmMassMailingKeyboard,
                parse_mode: 'HTML',
            }
        );
    } else {
        await ctx.reply(`Не могу распознать ваш вопрос!`);
    }
}

// --------------------------
// функция запрашивает имя пользователя при первичной аутентификации
async function askForName(conversation, ctx) {
    while (true) {
        await ctx.reply('Как я могу к тебе обращаться? Напиши свое имя...', {
            parse_mode: 'HTML',
        });

        const clientNameObj = await conversation.wait();
        const clientTextName = clientNameObj.update.message.text;

        if (clientTextName === '/start') {
            await ctx.reply('Пожалуйста, введи корректное имя еще раз...', {
                parse_mode: 'HTML',
            });
        } else {
            ctx.session.clientName = clientTextName;
            await askForCity(conversation, ctx);
            break; // выходим из цикла, если имя корректное
        }
    }
}

// функция запрашивает город и при необходимости может возвращать клиента назад к вопросу об имени
async function askForCity(conversation, ctx) {
    try {
        await ctx.reply('Из какого ты города?', { parse_mode: 'HTML' });

        const cityObj = await conversation.wait();
        const cityName = cityObj.update.message.text.trim();

        const foundCity = await findCity(cityName);
        console.log('Осуществлен поиск по городам: ', foundCity);

        if (!foundCity) {
            await ctx.reply('Произошла ошибка при поиске города. Попробуй еще раз.');
            return await askForCity(conversation, ctx); // Повторный запрос города
        }

        if (foundCity.length === 1) {
            ctx.session.clientCity = foundCity[0].city_name;
            try {
                await addClientToDB(ctx);
                await ctx.reply(
                    `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
                    { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                );
            } catch (error) {
                console.error('Ошибка при добавлении клиента в БД:', error);
                await ctx.reply('Не удалось сохранить информацию. Пожалуйста, попробуй позже.');
            }
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
                    return await askForName(conversation, ctx); // Возвращаемся к вопросу об имени
                } else {
                    ctx.session.clientCity = selectedCity;
                    try {
                        await addClientToDB(ctx);
                        await ctx.reply(
                            `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
                            { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                        );
                    } catch (error) {
                        console.error('Ошибка при добавлении клиента в БД:', error);
                        await ctx.reply(
                            'Не удалось сохранить информацию. Пожалуйста, попробуй позже.'
                        );
                    }
                }
            }
        } else {
            // Если город не нашелся, добавляем новый город в БД
            ctx.session.clientCity = cityName;
            try {
                await addNewCityToDB(ctx);
                await addClientToDB(ctx);
                await ctx.reply(
                    `${ctx.session.clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`,
                    { reply_markup: getGiftKeyboard, parse_mode: 'HTML' }
                );
            } catch (error) {
                console.error('Ошибка при добавлении нового города или клиента в БД:', error);
                await ctx.reply(
                    'Произошла ошибка при сохранении информации. Попробуй еще раз позже.'
                );
            }
        }
    } catch (error) {
        console.error('Ошибка в процессе запроса города:', error);
        await ctx.reply('Произошла непредвиденная ошибка. Попробуй снова.');
    }
}
