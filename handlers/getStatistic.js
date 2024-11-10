// импортируем необходимые функции из модуля функций
const { getStatistic } = require('../controllers/operationsWithDB');

const { adminKeyboard } = require('../config/keyboards');

const { commonMessages } = require('../controllers/messages');

const {
    setTotalClientsInMessage,
    setStatisticByClientsCityInMessage,
    setPeriodRegistrationInMessage,
    setTotalAgreeClientsInMessage,
    setPeriodLastVisitInMessage,
    safelyEditMessageReplyMarkup,
} = require('../utilites');

async function handleStatistic(ctx) {
    await safelyEditMessageReplyMarkup(ctx, { inline_keyboard: [] });
    await ctx.reply(`${commonMessages.waiting}`, { parse_mode: 'HTML' });
    const statisticObj = await getStatistic();
    if (statisticObj) {
        await ctx.reply(
            `СТАТИСТИКА\n---------------\nВсего клиентов: ${setTotalClientsInMessage(
                statisticObj
            )} чел.\n---------------\n${setStatisticByClientsCityInMessage(
                statisticObj
            )}\n${setTotalAgreeClientsInMessage(statisticObj)}\n\n${setPeriodRegistrationInMessage(
                statisticObj
            )}\n\n${setPeriodLastVisitInMessage(statisticObj)}`,
            { parse_mode: 'HTML', reply_markup: adminKeyboard }
        );
    } else {
        await ctx.reply(`${commonMessages.emptyDB}`, {
            parse_mode: 'HTML',
            reply_markup: adminKeyboard,
        });
    }
}

module.exports = { handleStatistic };
