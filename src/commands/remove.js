import { confirm, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { success, error, warn, info } from '../utils/display.js';
import { withSpinner } from '../utils/loader.js';
import { readPkg, listPackages } from '../utils/packageUtils.js';
import { run } from '../utils/runner.js';

export default async function remove(packages, options) {
  const pkg = readPkg();
  if (!pkg) {
    error('No package.json found. Run ' + chalk.cyan('pkgman init') + ' first.');
    return;
  }

  if (!packages || packages.length === 0) {
    const installed = listPackages();
    if (installed.length === 0) { warn('No installed packages to remove.'); return; }

    packages = await checkbox({
      message : 'Select packages to remove:',
      choices : installed.map((p) => ({
        name  : `${p.name} ${chalk.gray('@' + p.version)}  ${chalk.yellow(p.type)}`,
        value : p.name,
      })),
      validate: (v) => v.length > 0 || 'Select at least one package',
    });
  }

  if (packages.length === 0) { warn('No packages selected.'); return; }

  const confirmed = await confirm({
    message: `Remove ${packages.map((p) => chalk.cyan(p)).join(', ')}?`,
    default: false,
  });
  if (!confirmed) { info('Removal cancelled.'); return; }

  const manager = options.yarn ? 'yarn' : 'npm';
  const args    = manager === 'yarn' ? ['remove', ...packages] : ['uninstall', ...packages];

  info(`Using ${chalk.bold(manager)} to remove: ${packages.map((p) => chalk.cyan(p)).join(', ')}`);
  console.log();

  try {
    await withSpinner(`Removing ${packages.join(', ')}…`, async (spinner) => {
      spinner.stop();
      await run(manager, args);
      spinner.succeed(chalk.green('Removal complete'));
    });
    packages.forEach((p) => success(`${chalk.bold(p)} removed successfully`));
  } catch (err) {
    error(`Removal failed: ${err.message}`);
    process.exit(1);
  }
}
