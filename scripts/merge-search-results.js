const fs = require("fs-extra");
const path = require("path");

const SEARCH_RESULTS_DIR = "search-results";
const FINAL_PACKAGES_FILE = "packages-list.json";

async function mergeResults() {
  console.log("Начинаем объединение результатов поиска...");

  const files = await fs.readdir(SEARCH_RESULTS_DIR);
  const packagesSet = new Set();

  for (const file of files) {
    if (!file.endsWith("-packages.json")) continue;

    console.log(`Обработка файла ${file}...`);
    const packages = await fs.readJson(path.join(SEARCH_RESULTS_DIR, file));
    packages.forEach((pkg) => packagesSet.add(pkg));
  }

  const uniquePackages = Array.from(packagesSet);
  await fs.writeJson(FINAL_PACKAGES_FILE, uniquePackages, { spaces: 2 });

  console.log(`\nГотово! Всего уникальных пакетов: ${uniquePackages.length}`);
}

mergeResults().catch(console.error);
