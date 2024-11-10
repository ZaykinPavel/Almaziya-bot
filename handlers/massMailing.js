const { updateLastMailing } = require('../controllers/operationsWithDB');
const { adminKeyboard, stopMassMailingKeyboard } = require('../config/keyboards');
const { massMailingMessages } = require('../controllers/messages');

async function startMassmailing(bot, ctx, clientsForMailing) {
    let breakMassmailing = false;
    // Уведомляем пользователя о начале рассылки
    const massMailingMessage = await ctx.reply(massMailingMessages.startMassMailing, {
        reply_markup: stopMassMailingKeyboard,
    });

    const textForMassMailing = ctx.session.draftMessage || ''; // Если нет текста, устанавливаем пустую строку
    const attachment = ctx.session.attachment;

    console.log(
        'Получатели:',
        clientsForMailing,
        'Текст рассылки:',
        textForMassMailing,
        'Вложение:',
        attachment
    );

    // Функция для отправки сообщений с проверкой флага остановки
    const sendMessage = async (client, text, attachment) => {
        const { clienttgid, clientname } = client;
        const chatId = parseInt(clienttgid, 10);

        if (isNaN(chatId)) {
            console.error(`Некорректный client_tg_id для клиента ${clientname}: ${clienttgid}`);
            return;
        }

        try {
            const options = text ? { caption: text, parse_mode: 'HTML' } : {};

            if (attachment) {
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
                await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' });
            }

            console.log(`Сообщение отправлено клиенту ${clientname} (ID: ${chatId})`);
            updateLastMailing(clienttgid);
        } catch (error) {
            console.error(
                `Не удалось отправить сообщение клиенту ${clientname} (ID: ${chatId}):`,
                error
            );
        }
    };

    // Функция для массовой рассылки
    for (const client of clientsForMailing) {
        // Проверка флага остановки на каждом шаге
        if (!ctx.session.isMassMailing) {
            console.log('Массовая рассылка остановлена на шаге. Прерываем цикл.');
            breakMassmailing = true;
            break; // Прерываем цикл, если рассылка остановлена
        }

        await sendMessage(client, textForMassMailing, attachment);

        // Интервал между отправками с проверкой флага
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('Массовая рассылка завершена.');
    ctx.session.isMassMailing = false;
    if (breakMassmailing == false) {
        await ctx.api.editMessageReplyMarkup(
            massMailingMessage.chat.id,
            massMailingMessage.message_id,
            {
                inline_keyboard: [],
            }
        );
        await ctx.reply(massMailingMessages.endMassMailing, {
            reply_markup: adminKeyboard,
            parse_mode: 'HTML',
        });
    }
}

module.exports = { startMassmailing };
