const { admIds } = require('../config/botConfig');

const { unitMessages, commonMessages, registrationMessages } = require('../controllers/messages');

const { mainKeyboard, adminKeyboard } = require('../config/keyboards');

// импортируем необходимые функции из модуля функций
const { clientVerification, updateClientLastVisit } = require('../controllers/operationsWithDB');

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

module.exports = { handleStartCommand };
