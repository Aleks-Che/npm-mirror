const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const SEARCH_RESULTS_DIR = "search-results";
const PROGRESS_FILE = "search-progress.json";
const REGISTRY_URL = "https://registry.npmjs.org/-/v1/search";
const CHUNK_SIZE = 250;
const SAVE_THRESHOLD = 50000;

const SEARCH_QUERIES = [
  // Основные
  "js",
  "lib",
  "db",
  "node",
  "react",
  "vue",
  "angular",
  "ts",
  "api",
  "web",
  "ui",
  "app",
  "tool",
  "test",
  "server",
  "client",
  "data",
  "util",
  "utils",
  "core",
  "plugin",
  "module",

  // Фреймворки и библиотеки
  "express",
  "next",
  "nest",
  "webpack",
  "babel",
  "eslint",
  "redux",
  "mobx",
  "graphql",
  "prisma",
  "mongoose",

  // Типы пакетов
  "component",
  "middleware",
  "framework",
  "starter",
  "boilerplate",
  "template",
  "sdk",
  "cli",
  "package",
  "toolkit",

  // Функциональность
  "auth",
  "database",
  "cache",
  "queue",
  "stream",
  "crypto",
  "format",
  "parse",
  "convert",
  "transform",
  "validate",

  // Интеграции
  "aws",
  "azure",
  "google",
  "firebase",
  "mongo",
  "postgres",
  "redis",
  "docker",
  "kubernetes",
  "cloud",

  // Разработка
  "dev",
  "build",
  "deploy",
  "monitor",
  "debug",
  "log",
  "config",
  "env",
  "security",
  "performance",
];

let currentState = {
  query: null,
  from: 0,
  completedQueries: [],
};

async function loadProgress() {
  try {
    const progress = await fs.readJson(PROGRESS_FILE);
    currentState = {
      query: progress.query,
      from: progress.from,
      completedQueries: progress.completedQueries || [],
    };
    return true;
  } catch {
    return false;
  }
}

async function saveProgress() {
  await fs.writeJson(PROGRESS_FILE, currentState, { spaces: 2 });
}

async function searchPackages(query, from = 0, size = CHUNK_SIZE) {
  const url = `${REGISTRY_URL}?text=${query}&size=${size}&from=${from}`;
  const response = await axios.get(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "npm-mirror-tool/1.0",
    },
  });
  return response.data;
}

async function processQuery(query, startFrom = 0) {
  const queryResultFile = path.join(
    SEARCH_RESULTS_DIR,
    `${query}-packages.json`
  );
  let packages = [];

  if (await fs.pathExists(queryResultFile)) {
    packages = await fs.readJson(queryResultFile);
    console.log(
      `Загружено ${packages.length} существующих пакетов для "${query}"`
    );
  }

  const firstResult = await searchPackages(query, startFrom);
  const total = firstResult.total;
  console.log(`Найдено ${total} пакетов для запроса "${query}"`);

  if (startFrom === 0) {
    packages = firstResult.objects.map((obj) => obj.package.name);
  } else {
    packages = packages.concat(
      firstResult.objects.map((obj) => obj.package.name)
    );
  }

  let from = startFrom === 0 ? CHUNK_SIZE : startFrom + CHUNK_SIZE;

  while (from < total) {
    try {
      console.log(
        `Получаем пакеты ${from} - ${
          from + CHUNK_SIZE
        } из ${total} для "${query}"`
      );

      currentState.query = query;
      currentState.from = from;
      await saveProgress();

      const result = await searchPackages(query, from);
      const newPackages = result.objects.map((obj) => obj.package.name);
      packages = packages.concat(newPackages);

      if (packages.length % SAVE_THRESHOLD === 0) {
        await fs.writeJson(queryResultFile, packages, { spaces: 2 });
        console.log(`Сохранено ${packages.length} пакетов для "${query}"`);
      }

      from += CHUNK_SIZE;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(
        `Ошибка при получении пакетов для "${query}":`,
        error.message
      );
      throw error;
    }
  }

  await fs.writeJson(queryResultFile, packages, { spaces: 2 });
  currentState.completedQueries.push(query);
  currentState.query = null;
  currentState.from = 0;
  await saveProgress();

  console.log(
    `Завершен поисковый запрос "${query}": ${packages.length} пакетов`
  );
}

async function main() {
  await fs.ensureDir(SEARCH_RESULTS_DIR);

  const hasProgress = await loadProgress();
  if (hasProgress && currentState.query) {
    console.log(
      `Возобновление работы с запроса "${currentState.query}" с позиции ${currentState.from}`
    );
  }

  for (const query of SEARCH_QUERIES) {
    if (currentState.completedQueries.includes(query)) {
      console.log(`Пропуск выполненного запроса "${query}"`);
      continue;
    }

    if (currentState.query && query !== currentState.query) {
      continue;
    }

    try {
      console.log(`\nОбработка поискового запроса "${query}"`);
      const startFrom = query === currentState.query ? currentState.from : 0;
      await processQuery(query, startFrom);
    } catch (error) {
      throw error;
    }
  }

  console.log("\nВсе поисковые запросы обработаны!");
}

process.on("SIGINT", async () => {
  console.log("\nСохранение прогресса перед выходом...");
  await saveProgress();
  process.exit();
});

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
