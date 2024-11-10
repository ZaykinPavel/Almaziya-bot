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
};
