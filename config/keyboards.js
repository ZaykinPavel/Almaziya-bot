const { Keyboard, InlineKeyboard } = require('grammy');

const getGiftKeyboard = new InlineKeyboard().text('🎁 Забрать подарок', 'getGift').row();
const isGiftUsefulKeyboard = new InlineKeyboard()
    .text('👍 Да', 'isUseful')
    .text('🙅‍♂️ Нет', 'isNotUseful');
const isAgreeGetMessagesKeyboard = new InlineKeyboard()
    .text('👍 Конечно', 'isAgreeGetMessages')
    .text('🙅‍♂️ Лучше не надо', 'isNotAgreeGetMessages');
const mainKeyboard = new Keyboard()
    .text('Урок 1. Скульптор')
    .row()
    .text('Арабская подвеска')
    .row()
    .text('Кольцо')
    .row()
    .resized()
    .oneTime();

const adminKeyboard = new InlineKeyboard()
    .text('Рассылка всем', 'massMailing')
    .row()
    .text('Статистика', 'getStatistic')
    .row();

const returnKeyboard = new InlineKeyboard().text('Вернуться', 'adminKeyboard');

const confirmMassMailingKeyboard = new InlineKeyboard()
    .text('Подтвердить', 'confirmMassMailing')
    .row()
    .text('Вернуться', 'adminKeyboard')
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
};
