const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const SOURCE_SEGMENT = path.join('assets', 'node_modules');
const TARGET_SEGMENT = path.join('assets', 'vendor');
const SEARCH_SNIPPET = '/assets/node_modules/';
const REPLACE_SNIPPET = '/assets/vendor/';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(resolved));
    } else if (entry.isFile()) {
      files.push(resolved);
    }
  }
  return files;
}

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(SEARCH_SNIPPET)) {
    return false;
  }
  const updated = content.split(SEARCH_SNIPPET).join(REPLACE_SNIPPET);
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function main() {
  const sourceDir = path.join(DIST_DIR, SOURCE_SEGMENT);
  if (!fs.existsSync(sourceDir)) {
    console.log(`[fix-exported-assets] Nothing to change – "${SOURCE_SEGMENT}" not found.`);
    return;
  }

  const targetDir = path.join(DIST_DIR, TARGET_SEGMENT);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.renameSync(sourceDir, targetDir);

  const updatedFiles = [];
  for (const file of walk(DIST_DIR)) {
    const ext = path.extname(file);
    if (!['.js', '.json', '.html', '.css', '.map'].includes(ext)) {
      continue;
    }
    if (replaceInFile(file)) {
      updatedFiles.push(path.relative(DIST_DIR, file));
    }
  }

  console.log(
    `[fix-exported-assets] Moved assets to "${TARGET_SEGMENT}" and updated ${updatedFiles.length} files.`
  );
}

try {
  main();
} catch (error) {
  console.error('[fix-exported-assets] Failed:', error);
  process.exitCode = 1;
}
