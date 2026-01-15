Отлично. Для того чтобы браузер мог узнать, что на сервер пришел новый текст (так как браузер не умеет слушать порты напрямую), нам нужно связать их.

В этом решении используется **Node.js** с фреймворком **Express**.
Логика работы будет следующая:
1. **Сервер** принимает `curl` запрос и сохраняет текст в памяти.
2. **Браузер** (раз в секунду) опрашивает сервер: "Есть ли новый текст?".
3. Если текст есть и он отличается от текущего — браузер обновляет редактор.

### Шаг 1. Подготовка папки

Создайте новую папку для проекта, откройте в ней терминал и выполните команды:

```bash
npm init -y
npm install express
```

### Шаг 2. Код сервера (`server.js`)

Создайте файл `server.js` и вставьте туда следующий код:

```javascript
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
```

### Шаг 3. Обновленный код страницы (`index.html`)

Сохраните этот код в файл `index.html` в той же папке.
Я добавил скрипт в нижней части, который автоматически опрашивает сервер раз в секунду и обновляет текст, если он изменился.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Просмотр текста</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            background-color: #1e1e1e;
            font-family: sans-serif;
            overflow: hidden;
        }

        textarea {
            width: 100%;
            height: 100%;
            background-color: #1e1e1e;
            color: #d4d4d4;
            border: none;
            resize: none;
            outline: none;
            padding: 20px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 16px;
            line-height: 1.5;
            box-sizing: border-box;
            display: block;
        }

        .toolbar {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            background-color: rgba(40, 40, 40, 0.9);
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            z-index: 10;
        }

        button {
            cursor: pointer;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            transition: opacity 0.2s;
        }

        button:hover { opacity: 0.8; }

        .btn-clear { background-color: #3e3e42; color: #ffffff; }
        .btn-copy { background-color: #007acc; color: #ffffff; }
        
        .btn-copy.copied { background-color: #4ec9b0; color: #1e1e1e; }
    </style>
</head>
<body>

    <div class="toolbar">
        <button class="btn-clear" id="clearBtn">Очистить</button>
        <button class="btn-copy" id="copyBtn">Копировать</button>
    </div>

    <textarea id="editor" placeholder="Ожидание текста с сервера..."></textarea>

    <script>
        const editor = document.getElementById('editor');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtn = document.getElementById('copyBtn');
        const originalCopyText = copyBtn.innerText;

        // --- Функции интерфейса ---

        copyBtn.addEventListener('click', async () => {
            editor.select();
            editor.setSelectionRange(0, 999999);
            try {
                await navigator.clipboard.writeText(editor.value);
                copyBtn.innerText = "Скопировано!";
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerText = originalCopyText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Ошибка копирования: ', err);
            }
        });

        clearBtn.addEventListener('click', () => {
            editor.value = '';
            editor.focus();
            // Можно добавить запрос на сервер для очистки, если нужно
        });

        // --- Логика получения данных с сервера ---

        // Функция опроса сервера (Polling)
        async function fetchTextFromServer() {
            try {
                const response = await fetch('/text');
                const data = await response.json();
                
                // Обновляем редактор только если:
                // 1. Текст с сервера не пустой
                // 2. Текст отличается от текущего
                // 3. Пользователь сейчас не печатает в этом поле (не находится в фокусе)
                //    (чтобы не сбивать его ввод, пока он редактирует)
                
                if (data.text && data.text !== editor.value && document.activeElement !== editor) {
                    editor.value = data.text;
                }
            } catch (error) {
                console.error("Ошибка соединения с сервером:", error);
            }
        }

        // Запускаем опрос каждую 1 секунду
        setInterval(fetchTextFromServer, 1000);

    </script>
</body>
</html>
```

### Как запустить и проверить

1.  В терминале запустите сервер:
    ```bash
    node server.js
    ```
2.  Откройте браузер и перейдите по адресу:
    `http://localhost:5000`
3.  В отдельном терминале отправьте запрос (как вы просили):
    ```bash
    curl -X POST http://localhost:5000/text \
       -H "Content-Type: application/json" \
       -d '{"text": "Hello, World!"}'
    ```
4.  Текст "Hello, World!" автоматически появится в редакторе в браузере в течение одной секунды.
