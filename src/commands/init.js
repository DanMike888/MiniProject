import fs   from 'fs';
import path  from 'path';
import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { success, error, info, step, divider } from '../utils/display.js';
import { writePkg, readPkg } from '../utils/packageUtils.js';

const LICENSES   = ['MIT', 'ISC', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause', 'BSD-3-Clause', 'UNLICENSED'];
const MAIN_FILES = ['index.js', 'src/index.js', 'app.js', 'server.js'];

function buildPackage(answers) {
  const pkg = {
    name        : answers.name,
    version     : answers.version,
    description : answers.description,
    main        : answers.main,
    scripts     : {
      start : `node ${answers.main}`,
      test  : 'echo "Error: no test specified" && exit 1',
    },
    keywords : answers.keywords
      ? answers.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
    author  : answers.author,
    license : answers.license,
    dependencies    : {},
    devDependencies : {},
  };
  if (answers.private) pkg.private = true;
  return pkg;
}

function createEntryFile(mainFile) {
  const fullPath = path.join(process.cwd(), mainFile);
  const dir      = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, `'use strict';\n\nconsole.log('Hello from ${mainFile}');\n`, 'utf8');
    return true;
  }
  return false;
}

export default async function init(options) {
  const cwd      = process.cwd();
  const existing = readPkg(cwd);

  if (existing && !options.yes) {
    const overwrite = await confirm({
      message: chalk.yellow('A package.json already exists. Overwrite?'),
      default: false,
    });
    if (!overwrite) { info('Init cancelled — existing package.json kept.'); return; }
  }

  divider('Initialize New Project');

  let answers;

  if (options.yes) {
    answers = {
      name: path.basename(cwd), version: '1.0.0', description: '',
      main: 'index.js', keywords: '', author: '', license: 'MIT', private: false,
    };
  } else {
    answers = {
      name: await input({
        message : 'Project name:',
        default : path.basename(cwd),
        validate: (v) => /^[a-z0-9@._/-]+$/i.test(v) || 'Invalid package name',
      }),
      version: await input({
        message : 'Version:',
        default : '1.0.0',
        validate: (v) => /^\d+\.\d+\.\d+/.test(v) || 'Must follow semver (e.g. 1.0.0)',
      }),
      description : await input({ message: 'Description:', default: '' }),
      main        : await select({ message: 'Entry point:', choices: MAIN_FILES.map((v) => ({ value: v })), default: 'index.js' }),
      keywords    : await input({ message: 'Keywords (comma-separated):', default: '' }),
      author      : await input({ message: 'Author:', default: '' }),
      license     : await select({ message: 'License:', choices: LICENSES.map((v) => ({ value: v })), default: 'MIT' }),
      private     : await confirm({ message: 'Mark as private?', default: false }),
    };
  }

  const pkg = buildPackage(answers);
  writePkg(pkg, cwd);
  step(`Created ${chalk.cyan('package.json')}`);

  if (createEntryFile(answers.main)) step(`Created stub entry file ${chalk.cyan(answers.main)}`);

  const gitignorePath = path.join(cwd, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'node_modules/\n.env\n*.log\n', 'utf8');
    step(`Created ${chalk.cyan('.gitignore')}`);
  }

  console.log();
  success(`Project ${chalk.bold.cyan(pkg.name)} initialized successfully!`);
  info(`Run ${chalk.cyan('pkgman install <package>')} to add dependencies.`);
}
