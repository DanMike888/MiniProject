import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { success, error, info, step } from '../utils/display.js';
import { withSpinner } from '../utils/loader.js';
import { readPkg }     from '../utils/packageUtils.js';
import { run, hasYarn } from '../utils/runner.js';

export default async function install(packages, options) {
  const pkg = readPkg();
  if (!pkg) {
    error('No package.json found. Run ' + chalk.cyan('pkgman init') + ' first.');
    return;
  }

  if (!packages || packages.length === 0) {
    const pkgInput = await input({
      message : 'Enter package name(s) to install (space-separated):',
      validate: (v) => v.trim().length > 0 || 'Please enter at least one package name',
    });
    const isDev = await confirm({ message: 'Save as dev dependency?', default: false });
    packages = pkgInput.trim().split(/\s+/);
    if (isDev) options.saveDev = true;
  }

  const manager = options.yarn ? 'yarn' : 'npm';

  let args;
  if (manager === 'yarn') {
    args = ['add', ...packages];
    if (options.saveDev) args.push('--dev');
    if (options.global)  args = ['global', 'add', ...packages];
  } else {
    args = ['install', ...packages];
    if (options.saveDev) args.push('--save-dev');
    if (options.global)  args.push('--global');
    if (options.noSave)  args.push('--no-save');
  }

  info(`Using ${chalk.bold(manager)} to install: ${packages.map((p) => chalk.cyan(p)).join(', ')}`);
  if (options.saveDev) step('Saving as devDependency');
  if (options.global)  step('Installing globally');
  console.log();

  try {
    await withSpinner(`Installing ${packages.join(', ')}…`, async (spinner) => {
      spinner.stop();
      await run(manager, args);
      spinner.succeed(chalk.green('Installation complete'));
    });
    packages.forEach((p) => success(`${chalk.bold(p)} installed successfully`));
  } catch (err) {
    error(`Installation failed: ${err.message}`);
    process.exit(1);
  }
}
