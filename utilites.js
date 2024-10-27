const { Pool } = require('pg');
const dbConfig = require('./config/dbconfig');

const pool = new Pool(dbConfig);

// функция проверяет есть ли в сообщении любое слово из заданного массива
const findWords = (arr, message) => {
    const containsWord = arr.some((word) => message.includes(word));
    return containsWord;
};

// функция строит инлайн-клавиатуру на основании массива
const makeInlineKeyboardFromArr = (arr, fieldName) => {
    const keyboard = [];
    // строим кнопки на основании полученного массива
    arr.forEach((item) => {
        keyboard.push([
            {
                text: item[fieldName],
                callback_data: item[fieldName], // или любое другое значение для callback_data
            },
        ]);
    });
    // Обработка кнопки возврата
    keyboard.push([
        {
            text: 'Назад ↩️',
            callback_data: 'abort', // или любое другое значение для callback_data
        },
    ]);
    return {
        inline_keyboard: keyboard,
    };
};

// функция проверяет сообщение на точное совпадение с любым выражением из массива
const findExpression = (arr, message) => {
    let isContain = false;
    arr.forEach((word) => {
        if (message == word) {
            isContain = true;
            return;
        }
    });
    return isContain;
};

// функция делает первичную идентификацию клиента по базе на основании его ID
const clientVerification = async (ctx) => {
    const clientIdToString = ctx.from.id.toString();
    const findClientByTgIdQuery = 'SELECT * FROM clients WHERE client_tg_id=$1'; // Запрос должен быть в кавычках
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для первичной идентификации клиента прошло успешно');
        const records = await client.query(findClientByTgIdQuery, [`${clientIdToString}`]);
        return records.rows[0]; // Возвращаем записи
    } catch (err) {
        console.error('Ошибка подключения при первичной идентификации клиента', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// отменяет согласие на подписку у клиента
const checkAbortAggreToGetMessages = async (clientTgId) => {
    const updateClientByTgIdQuery =
        'UPDATE clients SET agree_to_get_messages = FALSE WHERE client_tg_id=$1'; // Запрос должен быть в кавычках
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для первичной идентификации клиента прошло успешно');
        const records = await client.query(updateClientByTgIdQuery, [`${clientTgId}`]);
        return records.rows[0]; // Возвращаем записи
    } catch (err) {
        console.error('Ошибка подключения при первичной идентификации клиента', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// функция, которая ищет город в таблице городов
const findCity = async (strToFind) => {
    const lastWordInStr = strToFind.split(' ').pop();
    const shortWordInStr = strToFind.split('.').pop();
    const findCities = `SELECT * FROM cities 
        WHERE city_name LIKE $1 
        OR city_name LIKE $2 
        OR city_name LIKE $3 
        OR city_name LIKE $4 
        OR city_name LIKE $5 
        OR city_name LIKE $6 
        OR city_name LIKE $7 
        OR city_name LIKE $8
        OR city_name LIKE $9 
        OR city_name LIKE $10 
        OR city_name LIKE $11 
        OR city_name LIKE $12`;
    const searchTerms = [
        `${strToFind}`,
        `${strToFind}%`,
        `%${strToFind}%`,
        `%${strToFind}`,
        `${lastWordInStr}`,
        `${lastWordInStr}%`,
        `%${lastWordInStr}%`,
        `%${lastWordInStr}`,
        `${shortWordInStr}`,
        `${shortWordInStr}%`,
        `%${shortWordInStr}%`,
        `%${shortWordInStr}`,
    ];
    let client;
    try {
        client = await pool.connect();
        const records = await client.query(findCities, searchTerms);
        return records.rows; // Возвращаем записи
    } catch (error) {
        console.error('Ошибка выполнения запроса на поиск доступных городов', error);
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

const getStatistic = async () => {
    const totalClientsQuery = 'SELECT COUNT(client_id) AS number_of_clients FROM clients;'; // Запрос должен быть в кавычках
    const clientsByCitiesQuery =
        'SELECT city_name as city, COUNT(city_name) clients_by_city FROM cities INNER JOIN clients USING(city_id) GROUP BY city_name ORDER BY city_name;';
    const agreeQuery = `SELECT 'agree' AS agree_status, COUNT(agree_to_get_messages) AS total FROM clients WHERE agree_to_get_messages=TRUE UNION ALL SELECT 'disagree' AS agree_status, COUNT(agree_to_get_messages) AS total FROM clients WHERE agree_to_get_messages=FALSE;`;
    const clientCreatedQuery = `SELECT TO_CHAR(created_at, 'YYYY-MM') AS year_month, COUNT(*) AS total FROM clients GROUP BY year_month ORDER BY year_month;`;
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для сбора статистики о клиентах прошло успешно');
        const recordsOfTotalClients = await client.query(totalClientsQuery);
        const recordsOfClientsByCities = await client.query(clientsByCitiesQuery);
        const recordsOfAgreeClients = await client.query(agreeQuery);
        const recordsPeriodCreatedClients = await client.query(clientCreatedQuery);
        return {
            totalClients: recordsOfTotalClients.rows[0],
            clientsByCities: recordsOfClientsByCities.rows,
            agreeClients: recordsOfAgreeClients.rows,
            createdPeriod: recordsPeriodCreatedClients.rows,
        }; // Возвращаем записи
    } catch (err) {
        console.error('Ошибка подключения при сборе статистики о клиентах', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// функция добавляет клиента в базу
const addClientToDB = async (ctx) => {
    const clientIdToString = ctx.from.id.toString();
    const clientName = ctx.session.clientName;
    const clientCity = ctx.session.clientCity;
    const clientAccount = ctx.from.username;
    const addClientQuery =
        'INSERT INTO clients (client_name, client_tg_id, client_account, city_id) VALUES ($1, $2, $3, (SELECT city_id FROM cities WHERE city_name=$4))';
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для добавления нового клиента успешно');
        const records = await client.query(addClientQuery, [
            clientName,
            clientIdToString,
            clientAccount,
            clientCity,
        ]);
        console.log('Новый клиент добавлен:', records.rows[0]);
    } catch (err) {
        console.error('Ошибка подключения или выполнения запроса добавления нового клиента', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// функция добавляет новый город в БД
const addNewCityToDB = async (ctx) => {
    const newCity = ctx.session.clientCity;
    const addCityQuery = 'INSERT INTO cities (city_name) VALUES ($1)';
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение к БД для добавления нового города прошло успешно');
        const records = await client.query(addCityQuery, [newCity]);
        console.log('Новый город добавлен:', records.rows[0]);
    } catch (err) {
        console.error(
            'Ошибка подключения или выполнения запроса при добавлении нового города',
            err
        );
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

const setTotalClientsInMessage = (stat) => {
    return `${stat.totalClients.number_of_clients}`;
};

const setTotalAgreeClientsInMessage = (stat) => {
    return `<b>Согласие на рассылку:</b>\nСогласны: ${stat.agreeClients[0].total}\nНе согласны: ${stat.agreeClients[1].total}`;
};

const setPeriodRegistretionInMessage = (stat) => {
    return `<b>По дате регистрации в боте:</b>\nВ текущем месяце: ${getCurrentMonthData(
        stat.createdPeriod
    )}\nВ прошлом месяце: ${getPreviousMonthData(stat.createdPeriod)}`;
};

function getCurrentMonthData(data) {
    // Получаем текущую дату
    const now = new Date();
    // Форматируем текущий месяц и год в 'YYYY-MM'
    const currentYearMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
    const filteredData = data.filter((item) => item.year_month === currentYearMonth);
    if (filteredData.length > 0) {
        return filteredData[0].total;
    } else {
        return '0';
    }
}

function getPreviousMonthData(data) {
    // Получаем текущую дату
    const now = new Date();
    // Уменьшаем месяц на 1 для получения прошлого месяца
    now.setMonth(now.getMonth() - 1);
    // Форматируем прошлый месяц и год в 'YYYY-MM'
    const previousYearMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'

    // Фильтруем данные по прошлому месяцу
    const filteredData = data.filter((item) => item.year_month === previousYearMonth);

    // Возвращаем total или '0', если данные отсутствуют
    if (filteredData.length > 0) {
        return filteredData[0].total;
    } else {
        return '0';
    }
}

const setStatisticByClientsCityInMessage = (stat) => {
    let str = '<b>Распределение по городам:</b>\n';
    for (let i = 0; i < stat.clientsByCities.length; ++i) {
        str = `${str}${stat.clientsByCities[i].city}: ${stat.clientsByCities[i].clients_by_city} чел.\n`;
    }
    return str;
};

// Экспортируем функцию
module.exports = {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    makeInlineKeyboardFromArr,
    findWords,
    findExpression,
    checkAbortAggreToGetMessages,
    getStatistic,
    setTotalClientsInMessage,
    setStatisticByClientsCityInMessage,
    setPeriodRegistretionInMessage,
    setTotalAgreeClientsInMessage,
};
