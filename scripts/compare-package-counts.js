const fs = require("fs-extra");
const path = require("path");

const RESULTS_DIR = "package-counts";

async function getLatestFiles() {
  const files = await fs.readdir(RESULTS_DIR);
  const countFiles = files.filter((f) => f.startsWith("package-counts-"));
  countFiles.sort().reverse();
  if (countFiles.length < 2) {
    throw new Error("Недостаточно файлов для сравнения");
  }
  return {
    current: countFiles[0],
    previous: countFiles[1],
  };
}

async function compareResults() {
  const { current, previous } = await getLatestFiles();

  console.log(`Сравнение результатов:\n${current} vs ${previous}\n`);
  const currentData = await fs.readJson(path.join(RESULTS_DIR, current));
  const previousData = await fs.readJson(path.join(RESULTS_DIR, previous));
  const changes = [];
  for (const [query, currentCount] of Object.entries(currentData)) {
    const previousCount = previousData[query];

    if (previousCount === null || currentCount === null) {
      changes.push({
        query,
        status: "error",
        message: "Ошибка при получении данных",
      });
      continue;
    }

    const diff = currentCount - previousCount;
    if (diff !== 0) {
      changes.push({
        query,
        previous: previousCount,
        current: currentCount,
        diff,
        percentage: ((diff / previousCount) * 100).toFixed(2),
      });
    }
  }
  // Сортировка по изменененым пакетам
  changes.sort((a, b) => {
    if (a.status === "error") return 1;
    if (b.status === "error") return -1;
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  console.log(`\nРезультаты сравнения:\n`);
  for (const change of changes) {
    if (change.status === "error") {
      console.log(`${change.query}: ${change.message}`);
      continue;
    }

    const diffStr = change.diff > 0 ? `+${change.diff}` : change.diff;
    console.log(
      `${change.query}: ${change.previous.toLocaleString()} → ` +
        `${change.current.toLocaleString()} (${diffStr}, ${change.percentage}%)`
    );
  }
}
compareResults().catch(console.error);
