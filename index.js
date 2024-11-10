const { botToken, admIds } = require('./config/botConfig');

const { Unit_1_Sculptor, Unit_2_Rumyana, Unit_3_Makeup_lips } = require('./config/videoConfig');

const {
    unitMessages,
    commonMessages,
    banMessages,
    massMailingMessages,
    idQueryWordsArr,
    greetingsWordsArr,
    commonQuestionArr,
    registrationMessages,
} = require('./controllers/messages');

const { banWordsArr } = require('./controllers/banWords');

const { handleStatistic } = require('./handlers/getStatistic');

const {
    mainKeyboard,
    adminKeyboard,
    returnKeyboard,
    confirmMassMailingKeyboard,
    massMailingKeyboard,
    confirmMassMailingJustRegisteredClientsKeyboard,
} = require('./config/keyboards');
// импортируем необходимые функции из модуля функций
const {
    clientVerification,
    checkAbortAggreToGetMessages,
    updateClientLastVisit,
    getAllAgreeClientsFromDB,
    getJustRegisteredClientsFromDB,
} = require('./controllers/operationsWithDB');

const { startMassmailing } = require('./handlers/massMailing');

// импортируем необходимые функции из модуля функций
const {
    sendGift,
    requestFeedback,
    findExpression,
    findWords,
    sendContentToClient,
    askForName,
    safelyEditMessageReplyMarkup,
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
            await ctx.reply(commonMessages.greetings.adminGreetingText(clientName), {
                reply_markup: adminKeyboard,
                parse_mode: 'HTML',
            });
        } else {
            await updateClientLastVisit(ctx);
            await ctx.reply(commonMessages.greetings.familiarClientGreetingText(clientName), {
                parse_mode: 'HTML',
            });
            await ctx.reply(unitMessages.introUnitMessages.chooseUnitText, {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        }
    } else {
        await ctx.reply(registrationMessages.startNewClientText, { parse_mode: 'HTML' });
        await ctx.conversation.enter('clientIdentify');
    }
}

async function clientIdentify(conversation, ctx) {
    // начинаем идентификацию с вопроса об имени
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
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                await requestFeedback(ctx);
                break;
            case 'isNotUseful':
            case 'isNotAgreeGetMessages':
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });

                await ctx.reply(unitMessages.introUnitMessages.thanksText, { parse_mode: 'HTML' });
                if (action === 'isNotAgreeGetMessages') {
                    await checkAbortAggreToGetMessages(ctx.session.clientInfo.client_tg_id);
                }
                break;
            case 'isAgreeGetMessages':
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                await ctx.reply(unitMessages.introUnitMessages.thanksForAgreeMailingText, {
                    parse_mode: 'HTML',
                    reply_markup: mainKeyboard,
                });
                break;
            case 'getStatistic':
                await handleStatistic(ctx);
                break;
            case 'massMailingOperations':
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                const chooseMailingVariant = await ctx.reply(
                    massMailingMessages.chooseMailingVariant,
                    {
                        reply_markup: massMailingKeyboard,
                    }
                );
                break;
            case 'massMailingAll':
                // Удаляем предыдущее сообщение, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                }
                const massMailingMessageAll = await ctx.reply(
                    massMailingMessages.getTextForMailing,
                    {
                        reply_markup: returnKeyboard,
                    }
                );
                ctx.session.massMailingMessageId = massMailingMessageAll.message_id; // Сохраняем ID сообщения
                ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                ctx.session.mailingVariant = 'allClients';
                break;
            case 'massMailingJustRegistered':
                // Удаляем предыдущее сообщение, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                }
                const statObj = await getJustRegisteredClientsFromDB();
                if (statObj.length !== 0) {
                    const massMailingMessageJustRegistered = await ctx.reply(
                        massMailingMessages.getTextForMailing,
                        {
                            reply_markup: returnKeyboard,
                        }
                    );
                    ctx.session.massMailingMessageId = massMailingMessageJustRegistered.message_id; // Сохраняем ID сообщения
                    ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                    ctx.session.mailingVariant = 'justRegisteredClients';
                } else {
                    await ctx.reply(massMailingMessages.clientsNotFoundText, {
                        reply_markup: massMailingKeyboard,
                        parse_mode: 'HTML',
                    });
                }
                break;
            case 'adminKeyboard':
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                // Удаляем сообщение массовой рассылки, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                    ctx.session.massMailingMessageId = null; // Сбрасываем ID после удаления
                }
                await ctx.reply(commonMessages.abortToMainMenuText, {
                    parse_mode: 'HTML',
                    reply_markup: adminKeyboard,
                });
                break;
            case 'confirmMassMailing':
                const clientsForMailing = await getAllAgreeClientsFromDB();
                startMassmailing(bot, ctx, clientsForMailing);
                ctx.session.attachment = null;
                break;
            case 'confirmMassMailingJustRegistered':
                const justRegisteredClientsForMailing = await getJustRegisteredClientsFromDB();
                startMassmailing(bot, ctx, justRegisteredClientsForMailing);
                ctx.session.attachment = null;
                break;
            case 'stopMassMailing':
                ctx.session.isMassMailing = false; // Устанавливаем флаг остановки
                ctx.session.mailingVariant = null;
                console.log(
                    'Массовая рассылка принудительно остановлена. Флаг: ',
                    ctx.session.isMassMailing
                ); // Логируем флаг
                await ctx.reply(massMailingMessages.stopMassMailing.stopMessage);
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
                await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
            } catch (error) {
                console.error(
                    'Ошибка при редактировании сообщения (Конечная проверка):',
                    error.message
                );
            }
        }
    }
}

async function handleIncomingMessage(ctx) {
    // проверяем, в какой форме приходит сообщение
    const message = (ctx.message.text || ctx.message.caption || '').toLowerCase();

    if (message === 'скульптор') {
        await sendContentToClient(
            ctx,
            Unit_1_Sculptor,
            unitMessages.unit1.reaction,
            unitMessages.unit1.loadingText,
            unitMessages.unit1.successText,
            unitMessages.unit1.promotionText
        );
    } else if (message === 'румяна') {
        await sendContentToClient(
            ctx,
            Unit_2_Rumyana,
            unitMessages.unit2.reaction,
            unitMessages.unit2.loadingText,
            unitMessages.unit2.successText,
            unitMessages.unit2.promotionText
        );
    } else if (message === 'макияж губ') {
        await sendContentToClient(
            ctx,
            Unit_3_Makeup_lips,
            unitMessages.unit3.reaction,
            unitMessages.unit3.loadingText,
            unitMessages.unit3.successText,
            unitMessages.unit3.promotionText
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
        }, banMessages.delay);
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

        if (ctx.session.mailingVariant == 'allClients') {
            const statObj = await getAllAgreeClientsFromDB();
            await ctx.reply(
                `ПОДТВЕРЖДЕНИЕ РАССЫЛКИ\nБудет отправлено следующее сообщение:\n--------------\n<b>${
                    ctx.session.draftMessage
                        ? ctx.session.draftMessage
                        : '(Отправка вложения без текста)'
                }</b>\n--------------\nСообщение получат: ${
                    statObj.length
                } клиентов.\n\n Подтверждаете рассылку?`,
                {
                    reply_markup: confirmMassMailingKeyboard,
                    parse_mode: 'HTML',
                }
            );
        } else if (ctx.session.mailingVariant == 'justRegisteredClients') {
            const statObj = await getJustRegisteredClientsFromDB();
            await ctx.reply(
                `ПОДТВЕРЖДЕНИЕ РАССЫЛКИ\nБудет отправлено следующее сообщение:\n--------------\n<b>${
                    ctx.session.draftMessage
                        ? ctx.session.draftMessage
                        : '(Отправка вложения без текста)'
                }</b>\n--------------\nСообщение получат: ${
                    statObj.length
                } клиентов.\n\n Подтверждаете рассылку?`,
                {
                    reply_markup: confirmMassMailingJustRegisteredClientsKeyboard,
                    parse_mode: 'HTML',
                }
            );
        }
    } else {
        await ctx.reply(`Не могу распознать ваш вопрос!`);
    }
}
