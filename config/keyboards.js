const { Keyboard, InlineKeyboard } = require('grammy');

const getGiftKeyboard = new InlineKeyboard().text('🎁 Забрать подарок', 'getGift').row();
const isGiftUsefulKeyboard = new InlineKeyboard()
    .text('👍 Да', 'isUseful')
    .text('🙅‍♂️ Нет', 'isNotUseful');
const isAgreeGetMessagesKeyboard = new InlineKeyboard()
    .text('👍 Конечно', 'isAgreeGetMessages')
    .text('🙅‍♂️ Лучше не надо', 'isNotAgreeGetMessages');
const mainKeyboard = new Keyboard()
    .text('Скульптор')
    .row()
    .text('Румяна')
    .row()
    .text('Макияж губ')
    .row()
    .resized()
    .oneTime();

const adminKeyboard = new InlineKeyboard()
    .text('✉️ Рассылка', 'massMailingOperations')
    .row()
    .text('📈 Статистика', 'getStatistic')
    .row();

const massMailingKeyboard = new InlineKeyboard()
    .text('💼 По всем клиентам', 'massMailingAll')
    .row()
    .text('🤝 Впервые зарегистрированным', 'massMailingJustRegistered')
    .row()
    .text('📅 По дате последней рассылки', 'massMailingByLastMailingInterval')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();

const entervalLastMailingKeyboard = new InlineKeyboard()
    .text('10 дн.', '10_lastMailing')
    .text('15 дн.', '15_lastMailing')
    .text('30 дн', '30_lastMailing')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();

const returnKeyboard = new InlineKeyboard().text('Вернуться ↩️', 'adminKeyboard');

const confirmMassMailingKeyboard = new InlineKeyboard()
    .text('✅ Подтвердить', 'confirmMassMailing')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();

const confirmMassMailingJustRegisteredClientsKeyboard = new InlineKeyboard()
    .text('✅ Подтвердить', 'confirmMassMailingJustRegistered')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();

const confirmMassMailingLastIntervalClientsKeyboard_10 = new InlineKeyboard()
    .text('✅ Подтвердить', 'confirmMassMailingLastInterval_10')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();
const confirmMassMailingLastIntervalClientsKeyboard_15 = new InlineKeyboard()
    .text('✅ Подтвердить', 'confirmMassMailingLastInterval_15')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();
const confirmMassMailingLastIntervalClientsKeyboard_30 = new InlineKeyboard()
    .text('✅ Подтвердить', 'confirmMassMailingLastInterval_30')
    .row()
    .text('Вернуться ↩️', 'adminKeyboard')
    .row();

const stopMassMailingKeyboard = new InlineKeyboard().text('Остановить рассылку', 'stopMassMailing');

module.exports = {
    getGiftKeyboard,
    isGiftUsefulKeyboard,
    isAgreeGetMessagesKeyboard,
    mainKeyboard,
    adminKeyboard,
    returnKeyboard,
    confirmMassMailingKeyboard,
    stopMassMailingKeyboard,
    massMailingKeyboard,
    confirmMassMailingJustRegisteredClientsKeyboard,
    entervalLastMailingKeyboard,
    confirmMassMailingLastIntervalClientsKeyboard_10,
    confirmMassMailingLastIntervalClientsKeyboard_15,
    confirmMassMailingLastIntervalClientsKeyboard_30,
};
