const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const REGISTRY_URL = "https://registry.npmjs.org/-/v1/search";
const RESULTS_DIR = "package-counts";
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

async function getPackagesCount(query) {
  const url = `${REGISTRY_URL}?text=${query}&size=1`;
  const response = await axios.get(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "npm-mirror-tool/1.0",
    },
  });
  return response.data.total;
}

async function main() {
  console.log("Подсчет количества пакетов по поисковым запросам:\n");

  const results = {};
  const date = new Date().toISOString().split("T")[0];

  for (const query of SEARCH_QUERIES) {
    try {
      const count = await getPackagesCount(query);
      console.log(`${query}: ${count.toLocaleString()} пакетов`);
      results[query] = count;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Ошибка при запросе '${query}':`, error.message);
      results[query] = null;
    }
  }

  await fs.ensureDir(RESULTS_DIR);
  const fileName = `package-counts-${date}.json`;
  await fs.writeJson(path.join(RESULTS_DIR, fileName), results, { spaces: 2 });

  console.log(`\nРезультаты сохранены в ${fileName}`);
}

main().catch(console.error);
