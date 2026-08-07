#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function walkAndFixCMakeTmp(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === 'CMakeTmp') {
      await ensureDir(path.join(entryPath, 'CMakeFiles'));
    }

    await walkAndFixCMakeTmp(entryPath);
  }
}

async function main() {
  const nodeModulesPath = path.join(root, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    const packages = await fs.promises.readdir(nodeModulesPath, { withFileTypes: true });

    for (const pkg of packages) {
      if (!pkg.isDirectory() || !pkg.name.startsWith('@')) {
        continue;
      }

      const scopePath = path.join(nodeModulesPath, pkg.name);
      const scopedPackages = await fs.promises.readdir(scopePath, { withFileTypes: true });

      for (const scopedPkg of scopedPackages) {
        if (!scopedPkg.isDirectory()) {
          continue;
        }

        const candidatePath = path.join(scopePath, scopedPkg.name, 'android', '.cxx');
        if (fs.existsSync(candidatePath)) {
          await walkAndFixCMakeTmp(candidatePath);
        }
      }
    }

    for (const pkg of packages) {
      if (!pkg.isDirectory() || pkg.name.startsWith('@')) {
        continue;
      }

      const candidatePath = path.join(nodeModulesPath, pkg.name, 'android', '.cxx');
      if (fs.existsSync(candidatePath)) {
        await walkAndFixCMakeTmp(candidatePath);
      }
    }
  }

  await ensureDir(path.join(root, 'android', 'app', 'build', 'tmp', 'kotlin-classes', 'release', 'com', 'maxsas'));
}

main().catch((error) => {
  console.error('[ensure-metro-watch-paths] Failed:', error.message);
  process.exitCode = 1;
});