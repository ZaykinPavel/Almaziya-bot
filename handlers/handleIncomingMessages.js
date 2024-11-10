const { Unit_1_Sculptor, Unit_2_Rumyana, Unit_3_Makeup_lips } = require('../config/videoConfig');

const {
    unitMessages,
    commonMessages,
    banMessages,
    massMailingMessages,
    idQueryWordsArr,
    greetingsWordsArr,
    commonQuestionArr,
} = require('../controllers/messages');

const { banWordsArr } = require('../controllers/banWords');

const {
    confirmMassMailingKeyboard,
    confirmMassMailingJustRegisteredClientsKeyboard,
} = require('../config/keyboards');

// импортируем необходимые функции из модуля функций
const {
    getAllAgreeClientsFromDB,
    getJustRegisteredClientsFromDB,
} = require('../controllers/operationsWithDB');

// импортируем необходимые функции из модуля функций
const { findExpression, findWords, sendContentToClient } = require('../utilites');

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

module.exports = { handleIncomingMessage };
