import { execSync, spawn } from 'child_process';

const isWin = process.platform === 'win32';

// On Windows, .cmd scripts must be invoked through cmd /c to avoid EINVAL with shell:false
function spawnCross(cmd, args, options) {
  if (isWin) {
    return spawn('cmd', ['/c', cmd, ...args], { ...options, shell: false });
  }
  return spawn(cmd, args, { ...options, shell: false });
}

export function hasYarn() {
  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function run(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnCross(cmd, args, {
      cwd  : process.cwd(),
      stdio: options.silent ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      child.stdout?.on('data', (d) => { stdout += d; });
      child.stderr?.on('data', (d) => { stderr += d; });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        const err  = new Error(`Command failed: ${cmd} ${args.join(' ')}`);
        err.code   = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });

    child.on('error', reject);
  });
}

export async function runJSON(cmd, args = []) {
  const { stdout } = await run(cmd, args, { silent: true });
  return JSON.parse(stdout);
}

// yarn audit outputs NDJSON (one JSON object per line), not a single JSON blob
export async function runNDJSON(cmd, args = []) {
  let stdout = '';
  try {
    const result = await run(cmd, args, { silent: true });
    stdout = result.stdout;
  } catch (err) {
    stdout = err.stdout || '';
    if (!stdout) throw err;
  }

  return stdout
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}
