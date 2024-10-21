require('dotenv').config();

// получаем доступ к менеджеру системы доступа к файлам и папкам
const fs = require('fs');
const createReadStream = require('fs').createReadStream;

// импортируем необходимые функции из модуля функций
const {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    makeInlineKeyboardFromArr,
    findWords,
    findExpression,
    checkAbortAggreToGetMessages,
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
    InputFile,
} = require('grammy');

// формируем массив бранных слов
const data = fs.readFileSync('./banwords.txt', { encoding: 'utf8' });
const banWordsArr = data.trim().split('\n');

const video1 = new InputFile(
    createReadStream('./video/258091765_Подвеска_цепочки_тройная_вертик.mov')
);
const video2 = new InputFile(
    createReadStream('./video/142304671_Подвеска_любовь_на_арабском_вертик.mov')
);
const video3 = new InputFile(createReadStream('./video/Видео--online-audio-convert.com.mp4'));

// импортируем библиотеки с диалогами
const { conversations, createConversation } = require('@grammyjs/conversations');

const getGiftKeyboard = new InlineKeyboard().text('🎁 Забрать подарок', 'getGift').row();
const isGiftUsefulKeyboard = new InlineKeyboard()
    .text('👍 Да', 'isUseful')
    .text('🙅‍♂️ Нет', 'isNotUseful');
const isAgreeGetMessagesKeyboard = new InlineKeyboard()
    .text('👍 Конечно', 'isAgreeGetMessages')
    .text('🙅‍♂️ Лучше не надо', 'isNotAgreeGetMessages');
const mainKeyboard = new Keyboard()
    .text('Тройная подвеска')
    .row()
    .text('Арабская подвеска')
    .row()
    .text('Кольцо')
    .row()
    .resized()
    .oneTime();
const idQueryWordsArr = [
    'мой id',
    'id?',
    'айди?',
    'у меня id',
    'у меня id?',
    'какой у меня id',
    'какой у меня id?',
    'какой у меня айди',
    'какой у меня айди?',
    'скажи id',
    'подскажи id',
    'подскажи мой id',
    'мой айди',
    'подскажи айди',
    'у меня айди',
    'у меня айди?',
    'подскажи мой айди',
];
const greetengsWordsArr = [
    'добрый день',
    'добрый день!',
    'доброго дня',
    'доброго дня!',
    'привет',
    'здарова',
    'здравствуйте',
    'здравствуй',
];
const commonQuestionArr = [
    'как дела',
    'как дела?',
    'как поживаешь',
    'как у тебя дела',
    'как поживаешь?',
    'как у тебя дела?',
];
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
        await ctx.reply(
            `👋 ${clientName}, добрый день! Рады, что вы заглянули в наш магазин ювелирной бижутерии By A&K`,
            {
                parse_mode: 'HTML',
            }
        );
        await ctx.reply('Выберите интересующий вас контент👇', {
            reply_markup: mainKeyboard,
            parse_mode: 'HTML',
        });
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
    ctx.session.clientInfo = await clientVerification(ctx);

    let timeoutId;
    if (ctx.callbackQuery.data === 'getGift') {
        try {
            await ctx.reply('Секундочку...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(
                new InputFile(
                    createReadStream('./video/258091765_Подвеска_цепочки_тройная_вертик.mov')
                )
            );

            await ctx.reply('Надеемся, что данный материал Вам понравится!', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (ctx.session.clientInfo) {
                timeoutId = setTimeout(async () => {
                    await ctx.reply(
                        `${ctx.session.clientInfo.client_name}, был ли подарок полезен для тебя?`,
                        {
                            reply_markup: isGiftUsefulKeyboard,
                            parse_mode: 'HTML',
                        }
                    );
                }, 200000);
            }
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (ctx.callbackQuery.data === 'isUseful') {
        if (ctx.session.clientInfo) {
            await ctx.reply(
                `Оставь пожалуйста отзыв о том, что подарок был действительно полезен.`,
                {
                    parse_mode: 'HTML',
                }
            );
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (ctx.session.clientInfo) {
                timeoutId = setTimeout(async () => {
                    await ctx.reply(
                        `А тебе было бы интересно получать уведомления о наших новинках?`,
                        {
                            reply_markup: isAgreeGetMessagesKeyboard,
                            parse_mode: 'HTML',
                        }
                    );
                }, 20000);
            }
        }
    } else if (ctx.callbackQuery.data === 'isNotUseful') {
        if (ctx.session.clientInfo) {
            await ctx.reply(`А тебе было бы интересно получать уведомления о наших новинках?`, {
                reply_markup: isAgreeGetMessagesKeyboard,
                parse_mode: 'HTML',
            });
        }
    } else if (ctx.callbackQuery.data === 'isAgreeGetMessages') {
        if (ctx.session.clientInfo) {
            await ctx.react('👌');
            await ctx.reply(
                `Большое спасибо! Будем и дальше стараться делать только полезный контент!`,
                {
                    parse_mode: 'HTML',
                }
            );
        }
    } else if (ctx.callbackQuery.data === 'isNotAgreeGetMessages') {
        if (ctx.session.clientInfo) {
            await ctx.react('👌');
            await ctx.reply(`Спасибо за уделённое время!😃`, {
                parse_mode: 'HTML',
            });
            await checkAbortAggreToGetMessages(ctx.session.clientInfo.client_tg_id);
        }
    }
    // Удаление клавиатуры
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
});

// Ответ бота на команды, которые не нашлись в коде
bot.on('message', async (ctx) => {
    let timeoutId;
    const message = ctx.message.text;

    if (message == 'Тройная подвеска') {
        try {
            // Очищаем предыдущий таймаут, если он существует
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Добавляем реакцию через некоторое время (например, 2 секунды)
            timeoutId = setTimeout(async () => {
                await ctx.react('👌');
            }, 2000);

            await ctx.reply(
                'Мне тоже нравится эта бижутерия! Немножко подождите пока ищу для вас контент...',
                {
                    parse_mode: 'HTML',
                }
            );

            await ctx.replyWithVideo(
                new InputFile(
                    createReadStream('./video/258091765_Подвеска_цепочки_тройная_вертик.mov')
                )
            );
            await ctx.reply('Отличный выбор! Особенно для вечерних нарядов!', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (message == 'Арабская подвеска') {
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // Добавляем реакцию через некоторое время (например, 2 секунды)
        timeoutId = setTimeout(async () => {
            await ctx.react('❤️');
        }, 2000);
        // если мы хотим удалить предыдущее сообщение
        // await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        try {
            await ctx.reply('Отличный выбор. Уже передаю вам видео...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(
                new InputFile(
                    createReadStream('./video/142304671_Подвеска_любовь_на_арабском_вертик.mov')
                )
            );
            await ctx.reply('Почувствуй себя арабской принцессой', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (message == 'Кольцо') {
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // Добавляем реакцию через некоторое время (например, 2 секунды)
        timeoutId = setTimeout(async () => {
            await ctx.react('😍');
        }, 2000);
        // если мы хотим удалить предыдущее сообщение
        // await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);

        try {
            await ctx.reply('Кольца - это моя слабость! Секундочку...', {
                parse_mode: 'HTML',
            });
            await ctx.replyWithVideo(
                new InputFile(createReadStream('./video/Видео--online-audio-convert.com.mp4'))
            );
            await ctx.reply('Красивое кольцо безусловно подчеркнёт вашу индивидуальность', {
                reply_markup: mainKeyboard,
                parse_mode: 'HTML',
            });
        } catch (error) {
            console.error('Ошибка при отправке видео:', error.message);
            await ctx.answerCallbackQuery({
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    } else if (findExpression(idQueryWordsArr, message.toLowerCase())) {
        // обрабатываем команды на запрос id
        await ctx.reply(`Ваш id: ${ctx.from.id}`, {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
    } else if (findExpression(greetengsWordsArr, message.toLowerCase())) {
        await ctx.react('🤗');
        await ctx.reply('Добрый день! Чем я могу вам помочь?', {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
    } else if (findExpression(commonQuestionArr, message.toLowerCase())) {
        await ctx.react('👍');
        await ctx.reply('У меня всё отлично! Спасибо!', {
            reply_parameters: { message_id: ctx.msg.message_id },
        });
        await ctx.reply(
            'Кстати, на следующей неделе привезём новые позиции из последних топовых коллекций!'
        );
    } else if (findWords(banWordsArr, message.toLowerCase())) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        const sentMessage = await ctx.reply('Ругаемся?');
        // Очищаем предыдущий таймаут, если он существует
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(async () => {
            await ctx.api.deleteMessage(ctx.chat.id, sentMessage.message_id);
        }, 2000);
    }

    // обрабатываем нераспознанные команды
    else {
        await ctx.reply(`Не могу распознать ваш вопрос!`);
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
