const unitMessages = {
    introUnitMessages: {
        sharePartnerLink: {
            text: 'Лови ссылку на аккаунт <a href="https://www.instagram.com/samarinavisage?igsh=MTQ0YWdyZjA2NWd4aQ==">Самариной Лилии</a>. Загляни, у нее море классного контента.',
            delay: 5000,
        },
        prepareGift: {
            text: 'Мы подготовили для тебя серию классных видео-уроков. Пробуй и преображайся 👸',
            delay: 30000,
        },
        getFeedbackText:
            'Мы будем рады, если ты оставишь отзыв в карточке товара на WB. В отзыве напиши какой контент был бы тебе полезен!💖💖💖',
        takeGiftText: (clientName) => {
            return `${clientName}, спасибо, что ты с нами! Дарим тебе подарок от ТОП-визажиста города Москвы!`;
        },
        doYouLikeTheGift: {
            text: (clientName) => {
                return `${clientName}, тебе понравился подарок?`;
            },
            delay: 40000,
        },
        getAgreeText: 'А тебе было бы интересно получать уведомления о наших новинках?',
        thanksForAgreeMailingText:
            'Большое спасибо! Будем и дальше стараться делать только полезный контент!',
        chooseUnitText: 'Выбери интересующий тебя урок👇',
        thanksText: 'Спасибо за уделённое время!😃',
    },
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

const registrationMessages = {
    startNewClientText:
        'Привет, красотка! Рады приветствовать тебя в клубе для избранных от бренда ювелирной бижутерии By A&K❤️',
    getNameText: 'Как я могу к тебе обращаться? Напиши свое имя...',
    getNameAgainText: 'Пожалуйста, введи корректное имя еще раз...',
    getCityText: 'Из какого ты города?',
    getCityAgainText: 'Уточни пожалуйста город',
    cityNotFindText: 'Произошла ошибка при поиске города. Попробуй еще раз.',
    abortLastQuestuionText: 'Давай вернемся к предыдущему вопросу!',
    errorSaveClientToDBText: 'Не удалось сохранить информацию. Пожалуйста, попробуй позже.',
    underfinedErrorText: 'Произошла непредвиденная ошибка. Попробуй снова.',
};

const commonMessages = {
    greetings: {
        reaction: '🤗',
        reply: 'Добрый день! Чем я могу тебе помочь?',
        adminGreetingText: (clientName) => {
            return `👋 ${clientName}, привет! Как администратору бота тебе доступны специальные функции 👇`;
        },
        familiarClientGreetingText: (clientName) => {
            return `👋 ${clientName}, добрый день! Рады, что ты заглянула в наш премиальный клуб от бренда ювелирной бижутерии By A&K`;
        },
    },
    commonQuestion: {
        reaction: '👍',
        reply: 'У меня всё отлично! Спасибо!',
        postReply:
            'Кстати, на следующей неделе привезём новые позиции из последних топовых коллекций!',
    },
    unknownQuestion: 'Не могу распознать ваш вопрос!',
    waiting: 'Секундочку...',
    emptyDB: '`База данных пока пустая!',
    abortToMainMenuText: 'Возвращаемся в главное меню...',
};

const banMessages = {
    warning: 'Ругаемся?',
    delay: 2000,
};

const massMailingMessages = {
    singleAttachmentOnly: 'Допустимо только одно вложение к сообщению!',
    endMassMailing: 'Массовая рассылка завершена',
    startMassMailing: 'Началась массовая рассылка...',
    chooseMailingVariant: 'Выберите вариант массовой рассылки...',
    getTextForMailing: 'Введи текст сообщения...',
    clientsNotFoundText: 'Такие клиенты не найдены. Попробуй другой вариант рассылки',
    setIntervalForMassMailingText: 'Выбери интервал для массовой рассылки...',
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
    registrationMessages,
};
