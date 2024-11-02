const { Pool } = require('pg');
const dbConfig = require('../config/dbconfig');

const pool = new Pool(dbConfig);

const updateClientLastVisit = async (ctx) => {
    const clientIdToString = ctx.from.id.toString();
    if (clientIdToString) {
        const updateLastVisitQuery =
            'UPDATE clients SET last_visited_at = CURRENT_TIMESTAMP WHERE client_tg_id=$1'; // Запрос должен быть в кавычках
        let client;
        try {
            client = await pool.connect();
            console.log('Подключение для обновления даты последнего захода прошло успешно');
            const records = await client.query(updateLastVisitQuery, [`${clientIdToString}`]);
            return;
        } catch (err) {
            console.error('Ошибка подключения при обновлении даты последнего захода', err);
            return null; // Возвращаем null в случае ошибки
        } finally {
            // Освобождаем соединение обратно в пул
            if (client) {
                client.release();
                console.log('Соединение закрыто');
            }
        }
    } else {
        return;
    }
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

const getAllClientsFromDB = async () => {
    const getAllClientsQuery =
        'SELECT client_tg_id AS clientTgId, client_name AS clientName FROM clients;';
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для сбора статистики о клиентах прошло успешно');
        const recordsAllClients = await client.query(getAllClientsQuery);

        return recordsAllClients.rows; // Возвращаем записи
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

const getStatistic = async () => {
    const totalClientsQuery = 'SELECT COUNT(client_id) AS number_of_clients FROM clients;'; // Запрос должен быть в кавычках
    const clientsByCitiesQuery =
        'SELECT city_name as city, COUNT(city_name) clients_by_city FROM cities INNER JOIN clients USING(city_id) GROUP BY city_name ORDER BY city_name;';
    const agreeQuery = `SELECT 'agree' AS agree_status, COUNT(agree_to_get_messages) AS total FROM clients WHERE agree_to_get_messages=TRUE UNION ALL SELECT 'disagree' AS agree_status, COUNT(agree_to_get_messages) AS total FROM clients WHERE agree_to_get_messages=FALSE;`;
    const clientCreatedQuery = `SELECT TO_CHAR(created_at, 'YYYY-MM') AS year_month, COUNT(*) AS total FROM clients GROUP BY year_month ORDER BY year_month;`;
    const lastVisitedQuery = `SELECT TO_CHAR(last_visited_at, 'YYYY-MM') AS year_month, COUNT(*) AS total FROM clients GROUP BY year_month ORDER BY year_month;`;
    let client;
    try {
        client = await pool.connect();
        console.log('Подключение для сбора статистики о клиентах прошло успешно');
        const recordsOfTotalClients = await client.query(totalClientsQuery);
        const recordsOfClientsByCities = await client.query(clientsByCitiesQuery);
        const recordsOfAgreeClients = await client.query(agreeQuery);
        const recordsPeriodCreatedClients = await client.query(clientCreatedQuery);
        const recordsPeriodLastVisitedClients = await client.query(lastVisitedQuery);
        return {
            totalClients: recordsOfTotalClients.rows[0],
            clientsByCities: recordsOfClientsByCities.rows,
            agreeClients: recordsOfAgreeClients.rows,
            createdPeriod: recordsPeriodCreatedClients.rows,
            lastVisitPeriod: recordsPeriodLastVisitedClients.rows,
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

// Экспортируем функцию
module.exports = {
    clientVerification,
    findCity,
    addClientToDB,
    addNewCityToDB,
    checkAbortAggreToGetMessages,
    getStatistic,
    updateClientLastVisit,
    getAllClientsFromDB,
};
