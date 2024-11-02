const unitMessages = {
    sculptor: {
        reaction: '👌',
        loadingText:
            'Мне тоже нравится эта бижутерия! Немножко подождите пока ищу для вас контент...',
        successText: 'Отличный выбор! Особенно для вечерних нарядов!',
    },
    unit2: {
        reaction: '❤️',
        loadingText: 'Отличный выбор. Уже передаю вам видео...',
        successText: 'Почувствуй себя арабской принцессой',
    },
    unit3: {
        reaction: '😍',
        loadingText: 'Кольца - это моя слабость! Секундочку...',
        successText: 'Красивое кольцо безусловно подчеркнёт вашу индивидуальность',
    },
};

const commonMessages = {
    greetings: {
        reaction: '🤗',
        reply: 'Добрый день! Чем я могу вам помочь?',
    },
    commonQuestion: {
        reaction: '👍',
        reply: 'У меня всё отлично! Спасибо!',
        postReply:
            'Кстати, на следующей неделе привезём новые позиции из последних топовых коллекций!',
    },
    unknownQuestion: 'Не могу распознать ваш вопрос!',
};

const banMessages = {
    warning: 'Ругаемся?',
};

const massMailingMessages = {
    singleAttachmentOnly: 'Допустимо только одно вложение к сообщению!',
    endMassMailing: 'Массовая рассылка завершена',
    startMassMailing: 'Началась массовая рассылка...',
    stopMassMailing: {
        stopMessage: 'Массовая рассылка принудительно остановлена.',
        afterStopMessage: 'Меню администратора',
    },
};

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
const greetingsWordsArr = [
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

module.exports = {
    unitMessages,
    commonMessages,
    banMessages,
    massMailingMessages,
    idQueryWordsArr,
    greetingsWordsArr,
    commonQuestionArr,
};
