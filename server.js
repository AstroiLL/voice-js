const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Разрешаем парсить JSON тела запросов
app.use(express.json());

// Переменная для хранения последнего полученного текста
let latestText = "";

// Раздаем статические файлы (ваш index.html)
app.use(express.static(__dirname));

// Эндпоинт для приема текста (как в вашем curl запросе)
app.post('/text', (req, res) => {
    const { text } = req.body;
    
    if (text) {
        latestText = text;
        console.log(`[LOG] Получен текст: "${text}"`);
        res.status(200).send({ status: "success", message: "Текст получен" });
    } else {
        res.status(400).send({ status: "error", message: "Поле 'text' отсутствует" });
    }
});

// Эндпоинт для получения текста браузером (опрос)
app.get('/text', (req, res) => {
    res.json({ text: latestText });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
