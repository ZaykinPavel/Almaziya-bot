// импортируем функции для работы с БД
const { updateLastMailing } = require('../controllers/operationsWithDB');
// импортируем необходимые функции из модуля функций
const { sendAttachment } = require('../utilites');
// импортируем клавиатуры
const { adminKeyboard, stopMassMailingKeyboard } = require('../config/keyboards');
// импортируем библиотеку сообщений
const { massMailingMessages } = require('../controllers/messages');

async function startMassmailing(bot, ctx, clientsForMailing) {
    let breakMassmailing = false;

    // Уведомляем пользователя о начале рассылки + выводим кнопку принудительной остановки рассылки
    const massMailingMessage = await ctx.reply(massMailingMessages.startMassMailing, {
        reply_markup: stopMassMailingKeyboard,
    });

    // Получаем текст для рассылки (если есть) и вложение (если есть)
    const textForMassMailing = ctx.session.draftMessage || ''; // Если нет текста, устанавливаем пустую строку
    const attachment = ctx.session.attachment;

    // Логируем список получателей
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
        console.log('Подготовлен клиент для массовой рассылки:', client);

        // Извлекаем id клиента и его имя
        const { clienttgid, clientname } = client;
        const chatId = parseInt(clienttgid, 10);

        // Если clienttgid некорректен, логируем ошибку и пропускаем отправку
        if (isNaN(chatId)) {
            console.error(`Некорректный client_tg_id для клиента ${clientname}: ${clienttgid}`);
            return;
        }

        try {
            const options = text ? { caption: text, parse_mode: 'HTML' } : {};

            // Исправление: проверяем наличие вложения и типа
            if (attachment) {
                await sendAttachment(bot, chatId, attachment, options);
            } else if (text) {
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

    // Запускаем цикл массовой рассылки
    for (const client of clientsForMailing) {
        await sendMessage(client, textForMassMailing, attachment); // отправляем сообщение клиенту с текстом и вложением
        await new Promise((resolve) => setTimeout(resolve, 5000)); // интервал между отправками с проверкой флага
        // Проверка флага остановки на каждом шаге
        if (!ctx.session.isMassMailing) {
            console.log('Массовая рассылка приудительно остановлена по кнопке. Прерываем цикл.');
            breakMassmailing = true; // включаем флаг прерывания рассылки
            break; // выходим из цикла массовой рассылки
        }
    }
    console.log('Массовая рассылка завершена.');
    ctx.session.isMassMailing = false; // снимаем флаг массовой рассылки
    ctx.session.attachment = null; // очищаем вложение из сессии
    // Если массовая рассылка не была прервана, то отправляем сообщение о её успешном завершении + очищаем предыдущую клавиатуру
    if (!breakMassmailing) {
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
