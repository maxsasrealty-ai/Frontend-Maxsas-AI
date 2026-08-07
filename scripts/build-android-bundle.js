const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const isWindows = process.platform === 'win32';
const env = { ...process.env, NODE_ENV: 'production' };
let mappedPath;
let mappedType;
let mappedDrive;

function getJavaVersion(javaCmd) {
  try {
    const result = spawnSync(javaCmd, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const output = result.stderr || result.stdout || '';
    const match = output.match(/version "(\d+)(?:\.\d+)?/);
    return match ? Number(match[1]) : null;
  } catch (error) {
    return null;
  }
}

function isValidJavaHome(javaHome) {
  if (!javaHome) {
    return false;
  }
  const javaBin = path.join(javaHome, 'bin', isWindows ? 'java.exe' : 'java');
  return fs.existsSync(javaBin);
}

function findJavaHomeInDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return null;
  }

  try {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const candidate = path.join(directory, entry.name);
      if (!isValidJavaHome(candidate)) {
        continue;
      }
      const version = getJavaVersion(path.join(candidate, 'bin', isWindows ? 'java.exe' : 'java'));
      if (version === 17) {
        return candidate;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function resolveJavaHome() {
  const currentJavaHome = process.env.JAVA_HOME?.trim();
  if (currentJavaHome && isValidJavaHome(currentJavaHome)) {
    const currentVersion = getJavaVersion(path.join(currentJavaHome, 'bin', isWindows ? 'java.exe' : 'java'));
    if (currentVersion === 17) {
      return currentJavaHome;
    }
  }

  const gradleJdkDir = path.join(os.homedir(), '.gradle', 'jdks');
  const candidate = findJavaHomeInDirectory(gradleJdkDir);
  if (candidate) {
    return candidate;
  }

  const programFilesJavaDir = path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Java');
  const programFilesX86JavaDir = path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Java');
  return findJavaHomeInDirectory(programFilesJavaDir) || findJavaHomeInDirectory(programFilesX86JavaDir);
}

function getFreeDriveLetter() {
  const letters = 'ZYXWVUTSRPONMLKJIHGFEDCBA'.split('');
  for (const letter of letters) {
    const drive = `${letter}:\\`;
    try {
      if (!fs.existsSync(drive)) {
        return letter;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function createSubst(targetPath) {
  const drive = getFreeDriveLetter();
  if (!drive) {
    return null;
  }

  const driveLetter = `${drive}:`;
  try {
    execSync(`cmd /c subst ${driveLetter} "${targetPath}"`, { stdio: 'ignore' });
    const mapped = `${driveLetter}\\`;
    if (fs.existsSync(mapped)) {
      return { drive: driveLetter, mapped };
    }
  } catch (error) {
    return null;
  }
  return null;
}

function removeSubst(driveLetter) {
  try {
    execSync(`cmd /c subst ${driveLetter} /D`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore cleanup failures.
  }
}

function createJunction(targetPath) {
  const base = 'C:\\rn-build';
  try {
    if (!fs.existsSync(base)) {
      fs.mkdirSync(base, { recursive: true });
    }
    const junctionPath = path.join(base, 'maxsas');
    if (fs.existsSync(junctionPath)) {
      fs.rmdirSync(junctionPath, { recursive: true });
    }
    execSync(`cmd /c mklink /J "${junctionPath}" "${targetPath}"`, { stdio: 'ignore' });
    return junctionPath;
  } catch (error) {
    return null;
  }
}

function removeJunction(junctionPath) {
  try {
    execSync(`cmd /c rmdir "${junctionPath}"`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore cleanup failures.
  }
}

function runGradle(cwd) {
  const executable = isWindows ? path.join(cwd, 'gradlew.bat') : path.join(cwd, 'gradlew');
  if (!fs.existsSync(executable)) {
    throw new Error(`Gradle wrapper not found at ${executable}`);
  }

  const result = spawnSync(executable, ['bundleRelease'], {
    cwd,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

function main() {
  let buildDir = androidDir;

  if (isWindows) {
    const javaHome = resolveJavaHome();
    if (javaHome) {
      env.JAVA_HOME = javaHome;
      console.log(`Using JDK 17 at ${javaHome} for Gradle build.`);
    } else {
      console.warn('WARNING: No Java 17 installation was detected. Set JAVA_HOME to a valid JDK 17 install before running this script.');
    }

    const junctionPath = createJunction(rootDir);
    if (junctionPath) {
      mappedPath = junctionPath;
      mappedType = 'junction';
      buildDir = path.join(junctionPath, 'android');
      console.log(`Using temporary junction at ${junctionPath} to reduce Windows path length.`);
    } else {
      const substResult = createSubst(rootDir);
      if (substResult) {
        mappedPath = substResult.mapped;
        mappedType = 'subst';
        mappedDrive = substResult.drive;
        buildDir = path.join(mappedPath, 'android');
        console.log(`Using temporary subst ${mappedDrive} for ${mappedPath} to reduce Windows path length.`);
      }
    }
  }

  try {
    runGradle(buildDir);
  } finally {
    if (mappedType === 'subst' && mappedDrive) {
      removeSubst(mappedDrive);
      console.log(`Removed temporary subst ${mappedDrive}.`);
    } else if (mappedType === 'junction' && mappedPath) {
      removeJunction(mappedPath);
      console.log(`Removed temporary junction ${mappedPath}.`);
    }
  }
}

main();
