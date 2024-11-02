const {
    isGiftUsefulKeyboard,
    isAgreeGetMessagesKeyboard,
    mainKeyboard,
} = require('./config/keyboards');
const { giftVideo } = require('./config/videoConfig');

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
    await ctx.reply('Секундочку...', { parse_mode: 'HTML' });
    await ctx.replyWithVideo(giftVideo);
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

async function sendContentToClient(ctx, video, emoji, introMessage, outroMessage) {
    await ctx.react(emoji);
    await ctx.reply(introMessage, { parse_mode: 'HTML' });
    await ctx.replyWithVideo(video);
    await ctx.reply(outroMessage, { reply_markup: mainKeyboard, parse_mode: 'HTML' });
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
};
