const unitMessages = {
    unit1: {
        reaction: '👌',
        loadingText:
            'Скульптор в макияже - это отличный способ подчеркнуть свои лучшие черты лица. Уже загружаю для тебя урок...',
        successText:
            'Использование скульптора позволит создать желаемый образ и повысить уверенность в себе. Пробуй! У тебя всё получится!',
        promotionText:
            'В этом уроке на Лилии <a href="https://www.wildberries.ru/catalog/172419428/detail.aspx">набор 2 в 1: сверкающее колье и серьги</a>✨.',
    },
    unit2: {
        reaction: '❤️',
        loadingText: 'Отличный выбор. Уже передаю тебе видео...',
        successText: 'Румяна помогут преобразить твой образ и добавить свежести лицу',
        promotionText:
            'В этом уроке на Лилии <a href="https://www.wildberries.ru/catalog/162549040/detail.aspx">очаровательные серьги-бабочки</a>🦋🦋🦋.',
    },
    unit3: {
        reaction: '😍',
        loadingText: 'Секундочку...сейчас всё загрузится!',
        successText: 'Правильный макияж губ обязательно подчеркнёт твою природную красоту!',
        promotionText:
            'В этом уроке на Лилии <a href="https://www.wildberries.ru/catalog/225010308/detail.aspx ">набор 2 в 1: серьги и колье с фианитами</a>💎💎💎.',
    },
};

const commonMessages = {
    greetings: {
        reaction: '🤗',
        reply: 'Добрый день! Чем я могу тебе помочь?',
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
    delay: 2000,
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
