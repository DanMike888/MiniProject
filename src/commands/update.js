import { checkbox } from '@inquirer/prompts';
import chalk   from 'chalk';
import { success, error, warn, info, divider, sym } from '../utils/display.js';
import { withSpinner } from '../utils/loader.js';
import { readPkg }     from '../utils/packageUtils.js';
import { run, runJSON } from '../utils/runner.js';

async function getOutdated() {
  try {
    return await runJSON('npm', ['outdated', '--json']) || {};
  } catch (err) {
    if (err.stdout) {
      try { return JSON.parse(err.stdout); } catch { /* ignore */ }
    }
    return {};
  }
}

export default async function update(packages, options) {
  const pkg = readPkg();
  if (!pkg) {
    error('No package.json found. Run ' + chalk.cyan('pkgman init') + ' first.');
    return;
  }

  const manager = options.yarn ? 'yarn' : 'npm';
  info('Checking for outdated packages…');

  let outdated = {};
  await withSpinner('Fetching version information…', async (spinner) => {
    outdated = await getOutdated();
    spinner.succeed('Version check complete');
  });

  const outdatedNames = Object.keys(outdated);
  if (outdatedNames.length === 0) { success('All packages are up to date!'); return; }

  divider('Outdated Packages');
  outdatedNames.forEach((name) => {
    const { current, wanted, latest } = outdated[name];
    const target = options.latest ? latest : wanted;
    const arrow  = current === target
      ? chalk.gray('  (already at target)')
      : `${chalk.red(current)} ${sym.arrow} ${chalk.green(target)}`;
    console.log(`  ${chalk.white(name.padEnd(30))} ${arrow}  ${chalk.gray('(latest: ' + latest + ')')}`);
  });
  console.log();

  let toUpdate = packages && packages.length > 0 ? packages : outdatedNames;

  if ((!packages || packages.length === 0) && outdatedNames.length > 0) {
    toUpdate = await checkbox({
      message : 'Select packages to update:',
      choices : outdatedNames.map((name) => {
        const { current, wanted, latest } = outdated[name];
        const target = options.latest ? latest : wanted;
        return {
          name    : `${name.padEnd(30)} ${chalk.red(current)} → ${chalk.green(target)}`,
          value   : name,
          checked : true,
        };
      }),
    });
  }

  if (toUpdate.length === 0) { info('No packages selected for update.'); return; }

  let args;
  if (manager === 'yarn') {
    args = ['upgrade', ...toUpdate];
    if (options.latest) args.push('--latest');
  } else {
    args = options.latest
      ? ['install', ...toUpdate.map((p) => `${p}@latest`)]
      : ['update', ...toUpdate];
  }

  info(`Using ${chalk.bold(manager)} to update: ${toUpdate.map((p) => chalk.cyan(p)).join(', ')}`);
  console.log();

  try {
    await withSpinner(`Updating ${toUpdate.join(', ')}…`, async (spinner) => {
      spinner.stop();
      await run(manager, args);
      spinner.succeed(chalk.green('Update complete'));
    });
    toUpdate.forEach((p) => success(`${chalk.bold(p)} updated successfully`));
  } catch (err) {
    error(`Update failed: ${err.message}`);
    process.exit(1);
  }
}
