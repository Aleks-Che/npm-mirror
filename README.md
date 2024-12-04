# NPM Mirror Server

Локальное зеркало npm пакетов с возможностью раздачи через собственный registry сервер.

## Возможности

- Создание локального зеркала npm пакетов
- Сохранение последних 20 версий (или больше) каждой библиотеки
- Собственный registry сервер для раздачи пакетов
- Совместимость со стандартным npm клиентом
- Структурированное хранение пакетов
- Отслеживание статистики роста количества пакетов

## Установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
```

2. Установите зависимости:

```bash
npm install axios fs-extra semver express
```

## Структура проекта.

```
├── scripts/
│   ├── npm-mirror.js          # Скрипт для создания зеркала
│   ├── fetch-packages-by-query.js  # Скрипт для получения пакетов по поисковым запросам
│   ├── count-packages.js      # Скрипт подсчета количества пакетов
│   ├── compare-package-counts.js   # Скрипт сравнения статистики пакетов
│   └── merge-search-results.js     # Скрипт объединения результатов поиска
├── server/
│   └── npm-mirror-server.js   # Registry сервер
├── search-results/            # Директория с результатами поиска
├── package-counts/            # Директория со статистикой пакетов
└── npm-mirror/               # Директория с пакетами
```

## Использование

1. Получение списка пакетов

```bash
node scripts/fetch-packages-by-query.js
```

2. Объединение результатов поиска

```bash
node scripts/merge-search-results.js
```

3. Создание локального зеркала

```bash
node scripts/npm-mirror.js
```

4. Подсчет статистики пакетов

```bash
node scripts/count-packages.js
```

5. Сравнение статистики

```bash
node scripts/compare-package-counts.js
```

6. Запуск registry сервера
   Запустите локальный registry сервер:

```bash
node server/npm-mirror-server.js
```

Сервер запустится на порту 8080.

### Настройка npm клиента

Создайте .npmrc файл в корне вашего проекта:

```bash
registry=http://localhost:8080/
```

## Конфигурация

### Скрипты поиска пакетов

SEARCH_QUERIES - список поисковых запросов
CHUNK_SIZE - размер порции данных за запрос
SAVE_THRESHOLD - порог для сохранения результатов

### Скрипт зеркала (npm-mirror.js)

MIRROR_DIR - директория для сохранения пакетов
VERSIONS_TO_KEEP - количество сохраняемых версий
REGISTRY_URL - URL исходного npm registry

### Registry сервер (npm-mirror-server.js)

PORT - порт сервера
MIRROR_DIR - директория с пакетами

### API Endpoints

GET /:package - получение метаданных пакета
GET /:package/-/\* - скачивание tarball файла пакета

### Требования

Node.js 12+
npm 6+

### Рекомендации для production

Настройка HTTPS
Настройка CORS
Добавление кэширования
Настройка логирования
Добавление аутентификации
