const { sendGift, requestFeedback, safelyEditMessageReplyMarkup } = require('../utilites');

const {
    mainKeyboard,
    adminKeyboard,
    returnKeyboard,
    massMailingKeyboard,
    entervalLastMailingKeyboard,
} = require('../config/keyboards');

const { massMailingMessages, unitMessages, commonMessages } = require('../controllers/messages');

const {
    getAllAgreeClientsFromDB,
    getJustRegisteredClientsFromDB,
    clientVerification,
    checkAbortAggreToGetMessages,
    getAllClientsByLastMailingDateFromDB,
} = require('../controllers/operationsWithDB');

const { startMassmailing } = require('./massMailing');

const { handleStatistic } = require('./getStatistic');

// Функция для обработки callback запросов
async function handleCallbackQuery(ctx, bot) {
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
            case 'massMailingByLastMailingInterval':
                // Удаляем предыдущее сообщение, если оно существует
                if (ctx.session.massMailingMessageId) {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.massMailingMessageId);
                }
                const massMailingLastIntervalMessage = await ctx.reply(
                    massMailingMessages.setIntervalForMassMailingText,
                    {
                        reply_markup: entervalLastMailingKeyboard,
                    }
                );
                ctx.session.massMailingMessageId = massMailingLastIntervalMessage.message_id; // Сохраняем ID сообщения
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
                    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
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
            case '10_lastMailing':
                const clientsLast_10_DaysForMailing = await getAllClientsByLastMailingDateFromDB(
                    10
                );
                console.log(clientsLast_10_DaysForMailing);
                if (clientsLast_10_DaysForMailing.length !== 0) {
                    const massMailingMessageForLastInterval = await ctx.reply(
                        massMailingMessages.getTextForMailing,
                        {
                            reply_markup: returnKeyboard,
                        }
                    );
                    ctx.session.massMailingMessageId = massMailingMessageForLastInterval.message_id; // Сохраняем ID сообщения
                    ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                    ctx.session.mailingVariant = 'lastMailingIntervalClients_10';
                } else {
                    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                    await ctx.reply(massMailingMessages.clientsNotFoundText, {
                        reply_markup: massMailingKeyboard,
                        parse_mode: 'HTML',
                    });
                }
                break;
            case '15_lastMailing':
                const clientsLast_15_DaysForMailing = await getAllClientsByLastMailingDateFromDB(
                    15
                );
                console.log(clientsLast_15_DaysForMailing);
                if (clientsLast_15_DaysForMailing.length !== 0) {
                    const massMailingMessageForLastInterval = await ctx.reply(
                        massMailingMessages.getTextForMailing,
                        {
                            reply_markup: returnKeyboard,
                        }
                    );
                    ctx.session.massMailingMessageId = massMailingMessageForLastInterval.message_id; // Сохраняем ID сообщения
                    ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                    ctx.session.mailingVariant = 'lastMailingIntervalClients_15';
                } else {
                    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                    await ctx.reply(massMailingMessages.clientsNotFoundText, {
                        reply_markup: massMailingKeyboard,
                        parse_mode: 'HTML',
                    });
                }
                break;
            case '30_lastMailing':
                const clientsLast_30_DaysForMailing = await getAllClientsByLastMailingDateFromDB(
                    30
                );
                console.log(clientsLast_30_DaysForMailing);
                if (clientsLast_30_DaysForMailing.length !== 0) {
                    const massMailingMessageForLastInterval = await ctx.reply(
                        massMailingMessages.getTextForMailing,
                        {
                            reply_markup: returnKeyboard,
                        }
                    );
                    ctx.session.massMailingMessageId = massMailingMessageForLastInterval.message_id; // Сохраняем ID сообщения
                    ctx.session.isMassMailing = true; // Устанавливаем флаг для отслеживания массовой рассылки
                    ctx.session.mailingVariant = 'lastMailingIntervalClients_30';
                } else {
                    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
                    await ctx.reply(massMailingMessages.clientsNotFoundText, {
                        reply_markup: massMailingKeyboard,
                        parse_mode: 'HTML',
                    });
                }
                break;

            case 'confirmMassMailingJustRegistered':
                const justRegisteredClientsForMailing = await getJustRegisteredClientsFromDB();
                startMassmailing(bot, ctx, justRegisteredClientsForMailing);
                ctx.session.attachment = null;
                break;
            case 'confirmMassMailingLastInterval_10':
                const lastIntervalClientsForMailing_10 = await getAllClientsByLastMailingDateFromDB(
                    10
                );
                startMassmailing(bot, ctx, lastIntervalClientsForMailing_10);
                ctx.session.attachment = null;
                break;
            case 'confirmMassMailingLastInterval_15':
                const lastIntervalClientsForMailing_15 = await getAllClientsByLastMailingDateFromDB(
                    15
                );
                startMassmailing(bot, ctx, lastIntervalClientsForMailing_15);
                ctx.session.attachment = null;
                break;
            case 'confirmMassMailingLastInterval_30':
                const lastIntervalClientsForMailing_30 = await getAllClientsByLastMailingDateFromDB(
                    30
                );
                startMassmailing(bot, ctx, lastIntervalClientsForMailing_30);
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

module.exports = { handleCallbackQuery };
