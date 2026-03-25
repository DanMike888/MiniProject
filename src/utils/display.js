import chalk  from 'chalk';
import Table  from 'cli-table3';
import boxen  from 'boxen';

// ── Symbols ───────────────────────────────────────────────────────────────────
export const sym = {
  success : chalk.green('✔'),
  error   : chalk.red('✖'),
  warn    : chalk.yellow('⚠'),
  info    : chalk.cyan('ℹ'),
  arrow   : chalk.gray('→'),
  bullet  : chalk.gray('•'),
  tree    : {
    branch : '├── ',
    last   : '└── ',
    pipe   : '│   ',
    space  : '    ',
  },
};

export function success(msg) {
  console.log(`${sym.success} ${chalk.green(msg)}`);
}

export function error(msg) {
  console.error(`${sym.error} ${chalk.red(msg)}`);
}

export function warn(msg) {
  console.warn(`${sym.warn} ${chalk.yellow(msg)}`);
}

export function info(msg) {
  console.log(`${sym.info} ${chalk.cyan(msg)}`);
}

export function step(msg) {
  console.log(`  ${sym.arrow} ${chalk.gray(msg)}`);
}

export function divider(label = '') {
  const line = chalk.gray('─'.repeat(50));
  if (label) {
    console.log(`\n${chalk.bold.white(label)}`);
    console.log(line);
  } else {
    console.log(line);
  }
}

export function packageTable(packages, title = 'Installed Packages') {
  if (!packages || packages.length === 0) {
    warn('No packages found.');
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.cyan('Package'),
      chalk.bold.cyan('Version'),
      chalk.bold.cyan('Type'),
      chalk.bold.cyan('Description'),
    ],
    colWidths: [25, 15, 12, 40],
    style: { border: ['gray'], head: [] },
    wordWrap: true,
  });

  packages.forEach(({ name, version, type, description }) => {
    const typeColor =
      type === 'devDependency' ? chalk.yellow(type) :
      type === 'dependency'    ? chalk.green(type)  :
                                 chalk.gray(type);
    table.push([
      chalk.white(name),
      chalk.magenta(version || 'unknown'),
      typeColor,
      chalk.gray(description || '—'),
    ]);
  });

  divider(title);
  console.log(table.toString());
  console.log(chalk.gray(`  Total: ${packages.length} package(s)\n`));
}

function printTree(node, prefix = '', isLast = true) {
  const connector = isLast ? sym.tree.last : sym.tree.branch;
  const extension = isLast ? sym.tree.space : sym.tree.pipe;
  const nameStr   = chalk.white(node.name);
  const verStr    = node.version ? chalk.magenta(`@${node.version}`) : '';
  const depCount  = node.deps && node.deps.length > 0
    ? chalk.gray(` (${node.deps.length} dep${node.deps.length > 1 ? 's' : ''})`)
    : '';

  console.log(`${chalk.gray(prefix)}${chalk.gray(connector)}${nameStr}${verStr}${depCount}`);

  if (node.deps && node.deps.length > 0) {
    node.deps.forEach((child, idx) => {
      const last = idx === node.deps.length - 1;
      printTree(child, prefix + extension, last);
    });
  }
}

export function dependencyTree(root) {
  divider('Dependency Tree');
  console.log(`${chalk.bold.cyan(root.name)}${chalk.magenta(`@${root.version}`)}`);
  if (root.deps && root.deps.length > 0) {
    root.deps.forEach((child, idx) => {
      printTree(child, '', idx === root.deps.length - 1);
    });
  } else {
    console.log(chalk.gray('  (no dependencies)'));
  }
  console.log();
}

export function auditReport(results) {
  divider('Security Audit Report');

  if (!results || results.vulnerabilities === 0) {
    console.log(boxen(
      `${sym.success}  ${chalk.bold.green('No vulnerabilities found!')}\n` +
      chalk.gray('  Your dependencies look clean.'),
      { padding: 1, borderColor: 'green', borderStyle: 'round' }
    ));
    return;
  }

  const { critical = 0, high = 0, moderate = 0, low = 0, info: infoN = 0 } = results;

  const table = new Table({
    head: [chalk.bold.cyan('Severity'), chalk.bold.cyan('Count')],
    colWidths: [15, 10],
    style: { border: ['gray'], head: [] },
  });

  [
    [chalk.red.bold('Critical'), String(critical)],
    [chalk.red('High'),          String(high)],
    [chalk.yellow('Moderate'),   String(moderate)],
    [chalk.blue('Low'),          String(low)],
    [chalk.gray('Info'),         String(infoN)],
  ].forEach((r) => table.push(r));

  console.log(table.toString());

  if (results.advisories && results.advisories.length > 0) {
    console.log();
    divider('Advisories');
    results.advisories.forEach((adv) => {
      const sev = adv.severity === 'critical' ? chalk.red.bold(adv.severity)
                : adv.severity === 'high'     ? chalk.red(adv.severity)
                : adv.severity === 'moderate' ? chalk.yellow(adv.severity)
                                              : chalk.blue(adv.severity);
      console.log(`  ${sev}  ${chalk.white(adv.module)}  ${chalk.gray(adv.title)}`);
    });
  }
  console.log();
}
