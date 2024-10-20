const { Pool } = require('pg');
const { InlineKeyboard } = require('grammy');

// Создаем клиента с параметрами подключения
const pool = new Pool({
    user: 'postgres',
    host: 'localhost', // или адрес вашего сервера
    database: 'Almaziya',
    password: 'Za9263yK!',
    port: 5432, // стандартный порт PostgreSQL
});

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

// функция делает первичную идентификацию клиента по базе на основании его ID
const clientVerification = async (ctx) => {
    const clientIdToString = ctx.from.id.toString();
    const findClientByTgIdQuery = 'SELECT * FROM clients WHERE client_tg_id=$1'; // Запрос должен быть в кавычках
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение успешно');
        const records = await client.query(findClientByTgIdQuery, [`${clientIdToString}`]);
        return records.rows[0]; // Возвращаем записи
    } catch (err) {
        console.error('Ошибка подключения', err);
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
    console.log('Search Terms:', searchTerms);
    let client;
    try {
        client = await pool.connect();
        const records = await client.query(findCities, searchTerms);
        return records.rows; // Возвращаем записи
    } catch (error) {
        console.error('Ошибка выполнения запроса', error);
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
    console.log(clientCity);
    const clientAccount = ctx.from.username;
    const addClientQuery =
        'INSERT INTO clients (client_name, client_tg_id, client_account, city_id) VALUES ($1, $2, $3, (SELECT city_id FROM cities WHERE city_name=$4))';
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение успешно');
        const records = await client.query(addClientQuery, [
            clientName,
            clientIdToString,
            clientAccount,
            clientCity,
        ]);
        console.log('Новый клиент добавлен:', records.rows[0]);
    } catch (err) {
        console.error('Ошибка подключения или выполнения запроса', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// функция добавляет ровый город в БД
const addNewCityToDB = async (ctx) => {
    const newCity = ctx.session.clientCity;
    const addCityQuery = 'INSERT INTO cities (city_name) VALUES ($1)';
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение успешно');
        const records = await client.query(addCityQuery, [newCity]);
        console.log('Новый город добавлен:', records.rows[0]);
    } catch (err) {
        console.error('Ошибка подключения или выполнения запроса', err);
        return null; // Возвращаем null в случае ошибки
    } finally {
        // Освобождаем соединение обратно в пул
        if (client) {
            client.release();
            console.log('Соединение закрыто');
        }
    }
};

// Экспортируем функцию
module.exports = {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    makeInlineKeyboardFromArr,
};
