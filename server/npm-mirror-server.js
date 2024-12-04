const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = 8080;
const MIRROR_DIR = "./npm-mirror";

// Endpoint для получения информации о пакете
app.get("/:package", async (req, res) => {
  const packageName = req.params.package;
  const packageDir = path.join(MIRROR_DIR, packageName);

  try {
    const files = await fs.readdir(packageDir);
    const versions = {};

    files.forEach((file) => {
      if (file.endsWith(".tgz")) {
        const version = file.replace(`${packageName}-`, "").replace(".tgz", "");
        versions[version] = {
          name: packageName,
          version: version,
          dist: {
            tarball: `http://localhost:${PORT}/${packageName}/-/${file}`,
          },
        };
      }
    });

    res.json({
      name: packageName,
      versions: versions,
    });
  } catch (error) {
    res.status(404).json({ error: "Package not found" });
  }
});

// Endpoint для скачивания tarball
app.get("/:package/-/*", (req, res) => {
  const packageName = req.params.package;
  const fileName = path.basename(req.path);
  const filePath = path.join(MIRROR_DIR, packageName, fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(PORT, () => {
  console.log(`NPM mirror server running on port ${PORT}`);
});
