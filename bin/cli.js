#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

import initCmd    from '../src/commands/init.js';
import installCmd from '../src/commands/install.js';
import listCmd    from '../src/commands/list.js';
import removeCmd  from '../src/commands/remove.js';
import updateCmd  from '../src/commands/update.js';
import auditCmd   from '../src/commands/audit.js';

function showBanner() {
  const banner = chalk.bold.cyan('pkgman') +
    chalk.gray(' — Node.js Package Management System\n') +
    chalk.gray(`  v${version}  |  powered by npm & yarn`);
  console.log(boxen(banner, {
    padding      : 1,
    margin       : { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle  : 'round',
    borderColor  : 'cyan',
  }));
}

program
  .name('pkgman')
  .description('A CLI-based dependency management system')
  .version(version, '-v, --version', 'Display current version')
  .hook('preAction', showBanner);

// ── init ──────────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize a new Node.js project interactively')
  .option('-y, --yes', 'Skip prompts and use default values')
  .action((options) => initCmd(options));

// ── install ───────────────────────────────────────────────────────────────────
program
  .command('install [packages...]')
  .alias('i')
  .description('Install one or more packages')
  .option('-D, --save-dev', 'Save as a dev dependency')
  .option('-g, --global', 'Install globally')
  .option('--yarn', 'Use Yarn instead of npm')
  .option('--no-save', 'Do not save to package.json')
  .action((packages, options) => installCmd(packages, options));

// ── list ──────────────────────────────────────────────────────────────────────
program
  .command('list')
  .alias('ls')
  .description('List installed packages')
  .option('--tree', 'Display as a dependency tree')
  .option('--dev', 'Show only dev dependencies')
  .option('--prod', 'Show only production dependencies')
  .option('--depth <number>', 'Max tree depth (default: 2)', '2')
  .action((options) => listCmd(options));

// ── remove ────────────────────────────────────────────────────────────────────
program
  .command('remove <packages...>')
  .alias('rm')
  .description('Remove one or more packages')
  .option('--yarn', 'Use Yarn instead of npm')
  .action((packages, options) => removeCmd(packages, options));

// ── update ────────────────────────────────────────────────────────────────────
program
  .command('update [packages...]')
  .alias('up')
  .description('Update packages to their latest allowed versions')
  .option('--yarn', 'Use Yarn instead of npm')
  .option('--latest', 'Ignore semver range and install latest')
  .action((packages, options) => updateCmd(packages, options));

// ── audit ─────────────────────────────────────────────────────────────────────
program
  .command('audit')
  .description('Run a security audit on installed packages')
  .option('--fix', 'Automatically fix vulnerabilities')
  .option('--yarn', 'Use Yarn instead of npm')
  .action((options) => auditCmd(options));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
}
