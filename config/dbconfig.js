require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
};

module.exports = dbConfig;
