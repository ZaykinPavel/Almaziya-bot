const fs = require('fs');
// формируем массив бранных слов
const data = fs.readFileSync('./banwords.txt', { encoding: 'utf8' });
const banWordsArr = data.trim().split('\n');

module.exports = {
    banWordsArr,
};
