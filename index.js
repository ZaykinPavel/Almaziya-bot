const { botToken } = require('./config/botConfig');

const { handleCallbackQuery } = require('./handlers/handleCallBackQuery');
const { handleIncomingMessage } = require('./handlers/handleIncomingMessages');
const { handleStartCommand } = require('./handlers/handleStartCommand');

// импортируем необходимые функции из модуля функций
const { askForName } = require('./utilites');

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
    await handleCallbackQuery(ctx, bot);
});

// теперь запустим нашего бота, но он пока не реагирует на команды пользователя, поэтому надо добавить соответствующий код на коменду start (выше добавлен)
bot.start();

async function clientIdentify(conversation, ctx) {
    // начинаем идентификацию с вопроса об имени
    await askForName(conversation, ctx);
}
