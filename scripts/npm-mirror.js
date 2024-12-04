const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const semver = require("semver");

const MIRROR_DIR = "L:/npm-mirror";
const REGISTRY_URL = "https://registry.npmjs.org";
const VERSIONS_TO_KEEP = 20;
const PROGRESS_FILE = "download-progress.json";
const PACKAGES_FILE = "packages-list.json";

async function loadPackagesList() {
  console.log("Загрузка списка пакетов из файла...");
  const packages = await fs.readJson(PACKAGES_FILE);
  console.log(`Загружено ${packages.length} пакетов`);
  return packages;
}

async function getPackageVersions(packageName) {
  console.log(`Получение версий для ${packageName}...`);
  const response = await axios.get(`${REGISTRY_URL}/${packageName}`);
  const versions = Object.keys(response.data.versions);
  return versions.sort(semver.rcompare).slice(0, VERSIONS_TO_KEEP);
}

async function downloadPackage(packageName, version) {
  const tarballUrl = `${REGISTRY_URL}/${packageName}/-/${packageName}-${version}.tgz`;
  const targetDir = path.join(MIRROR_DIR, packageName);
  const targetFile = path.join(targetDir, `${packageName}-${version}.tgz`);

  if (await fs.pathExists(targetFile)) {
    console.log(`Пропуск ${packageName}@${version} - уже существует`);
    return;
  }

  console.log(`Скачивание ${packageName}@${version}...`);
  const response = await axios.get(tarballUrl, { responseType: "stream" });
  await fs.ensureDir(targetDir);

  const writer = fs.createWriteStream(targetFile);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function saveProgress(progress) {
  await fs.writeJson(PROGRESS_FILE, progress, { spaces: 2 });
}

async function loadProgress() {
  try {
    return await fs.readJson(PROGRESS_FILE);
  } catch {
    return { lastPackage: null, completed: [] };
  }
}

async function main() {
  console.log(`Запуск зеркалирования npm в ${MIRROR_DIR}`);
  await fs.ensureDir(MIRROR_DIR);

  const progress = await loadProgress();
  const packages = await loadPackagesList();
  let startIndex = 0;

  if (progress.lastPackage) {
    startIndex = packages.indexOf(progress.lastPackage) + 1;
    console.log(`Возобновление с пакета ${progress.lastPackage}`);
  }

  process.on("SIGINT", async () => {
    console.log("\nСохранение прогресса перед выходом...");
    await saveProgress({
      lastPackage: packages[startIndex - 1],
      completed: progress.completed,
    });
    process.exit();
  });

  for (let i = startIndex; i < packages.length; i++) {
    const pkg = packages[i];

    if (progress.completed.includes(pkg)) {
      console.log(`Пропуск ${pkg} - уже обработан`);
      continue;
    }

    try {
      console.log(`Обработка ${pkg} (${i + 1}/${packages.length})`);
      const versions = await getPackageVersions(pkg);
      for (const version of versions) {
        await downloadPackage(pkg, version);
      }
      progress.completed.push(pkg);
      await saveProgress({ lastPackage: pkg, completed: progress.completed });

      // Задержка между пакетами для избежания блокировки
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Ошибка обработки ${pkg}:`, error.message);
      fs.appendFileSync("error.log", `${pkg}: ${error.message}\n`);
    }
  }

  console.log("Зеркалирование завершено!");
}

main().catch((error) => {
  console.error("Фатальная ошибка:", error);
  process.exit(1);
});
