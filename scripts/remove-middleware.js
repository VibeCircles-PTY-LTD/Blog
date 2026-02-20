const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const candidates = [
  "middleware.ts",
  "middleware.js",
  "middleware.mjs",
  "middleware.cjs",
];

let removedAny = false;

for (const filename of candidates) {
  const fullPath = path.join(projectRoot, filename);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      removedAny = true;
      console.log(`[prebuild] Removed ${filename}`);
    } catch (error) {
      console.warn(`[prebuild] Failed to remove ${filename}: ${error.message}`);
    }
  }
}

if (!removedAny) {
  console.log("[prebuild] No middleware file found");
}
