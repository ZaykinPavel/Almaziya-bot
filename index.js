require('dotenv').config();

// получаем доступ к менеджеру системы доступа к файлам и папкам
const fs = require('fs');

// импортируем необходимые функции из модуля функций
const {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    makeInlineKeyboardFromArr,
} = require('./utilites');

// импортируем необходимый нам класс Bot из основной библиотеки grammy.js, а также классы обработчиков ошибок GrammyError и HttpError
const {
    Bot,
    GrammyError,
    Context,
    session,
    HttpError,
    Keyboard,
    InlineKeyboard,
} = require('grammy');

// импортируем библиотеки с диалогами
const { conversations, createConversation } = require('@grammyjs/conversations');

const getGiftKeyboard = new InlineKeyboard().text('🎁 Забрать подарок', 'getGift').row();

const bot = new Bot(process.env.BOT_API_KEY);
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
bot.command('start', async (ctx) => {
    ctx.session.clientInfo = await clientVerification(ctx);
    // если клиент уже есть в базе, то отправляем приветствие с учетом его имени
    if (ctx.session.clientInfo) {
        let clientName = ctx.session.clientInfo.client_name;
        ctx.reply(
            `👋 ${clientName}, добрый день! Рады, что вы заглянули в наш магазин ювелирной бижутерии By A&K`,
            {
                // reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            }
        );
    } else {
        await ctx.reply(
            '👋 Добрый день! Рады, что вы заглянули в наш магазин ювелирной бижутерии By A&K',
            {
                parse_mode: 'HTML',
            }
        );
        await ctx.conversation.enter('clientIdentify');
    }
});
// Обработчик нажатия на кнопку "Забрать подарок"
bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data === 'getGift') {
        const videoPath = './video/258091765.mov';
        // проверяем путь к файлу и обрабатываем ошибку
        if (!fs.existsSync(videoPath)) {
            console.error('Файл не найден:', videoPath);
            return;
        } else {
            console.log('Путь к файлу в порядке');
        }

        try {
            await ctx.replyWithVideo({ source: fs.createReadStream(videoPath) });
            await ctx.answerCallbackQuery({
                text: 'Подарок отправлен!',
                show_alert: true,
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    }
});

async function clientIdentify(conversation, ctx) {
    // Начинаем с вопроса о имени
    await askForName(conversation, ctx);
}

// теперь запустим нашего бота, но он пока не реагирует на команды пользователя, поэтому надо добавить соответствующий код на коменду start (выше добавлен)
bot.start();

// --------------------------
// функция запрашивает имя пользователя при первичной аутентификации
async function askForName(conversation, ctx) {
    await ctx.reply('Как я могу к вам обращаться? Напишите своё имя...', {
        parse_mode: 'HTML',
    });
    const clientNameObj = await conversation.wait();
    ctx.session.clientName = clientNameObj.update.message.text;

    await askForCity(conversation, ctx);
}

// функция запрашивает город и при необходимости может возвращать клиента назад к вопросу об имени
async function askForCity(conversation, ctx) {
    await ctx.reply('А из какого вы города?', {
        parse_mode: 'HTML',
    });
    const cityObj = await conversation.wait();
    const foundCity = await findCity(cityObj.update.message.text.trim());
    console.log('Осуществлен поиск по городам: ', foundCity);

    if (foundCity.length === 1) {
        ctx.session.clientCity = foundCity[0].city_name;
        await addClientToDB(ctx);
        await ctx.reply(
            `${ctx.session.clientName}, спасибо, что вы с нами! Дарим вам подарок от ведущего визажиста города Москвы!`,
            {
                reply_markup: getGiftKeyboard,
                parse_mode: 'HTML',
            }
        );
    } else if (foundCity.length > 1) {
        await ctx.reply('Уточните пожалуйста город', {
            parse_mode: 'HTML',
            reply_markup: makeInlineKeyboardFromArr(foundCity, 'city_name'),
        });
        const callbackQuery = await conversation.wait();
        if (callbackQuery.update.callback_query) {
            const selectedCity = callbackQuery.update.callback_query.data;

            if (selectedCity === 'abort') {
                await ctx.reply('Давайте вернемся к предыдущему вопросу!');
                await askForName(conversation, ctx); // Снова спрашиваем имя
            } else {
                ctx.session.clientCity = selectedCity; // Записываем выбранный город в сессию
                await addClientToDB(ctx);
                await ctx.reply(
                    `${ctx.session.clientName}, спасибо, что вы с нами! Дарим вам подарок от ведущего визажиста города Москвы!`,
                    {
                        reply_markup: getGiftKeyboard,
                        parse_mode: 'HTML',
                    }
                );
            }
        }
    } else {
        // если город не нашелся в списке, то добавляем город в БД, а потом записываем клиента
        ctx.session.clientCity = cityObj.update.message.text.trim();
        await addNewCityToDB(ctx);
        await addClientToDB(ctx);
        await ctx.reply(
            `${ctx.session.clientName}, спасибо, что вы с нами! Дарим вам подарок от ведущего визажиста города Москвы!`,
            {
                reply_markup: getGiftKeyboard,
                parse_mode: 'HTML',
            }
        );
    }
}
