const { Keyboard, InlineKeyboard } = require('grammy');

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

module.exports = {
    getGiftKeyboard,
    isGiftUsefulKeyboard,
    isAgreeGetMessagesKeyboard,
    mainKeyboard,
};
