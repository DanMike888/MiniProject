import chalk  from 'chalk';
import Table  from 'cli-table3';
import boxen  from 'boxen';
import { error, info, warn, step, divider } from '../utils/display.js';
import { withSpinner } from '../utils/loader.js';
import { readPkg }     from '../utils/packageUtils.js';
import { run, runJSON, runNDJSON, hasYarn } from '../utils/runner.js';

// ── npm audit JSON parser ─────────────────────────────────────────────────────
function parseNpmAudit(raw) {
  if (!raw || !raw.metadata) return null;

  const meta  = raw.metadata.vulnerabilities || {};
  const total = (meta.critical || 0) + (meta.high || 0) +
                (meta.moderate || 0) + (meta.low  || 0) + (meta.info || 0);

  const advisories = [];
  if (raw.vulnerabilities) {
    Object.values(raw.vulnerabilities).forEach((v) => {
      if (!Array.isArray(v.via)) return;
      v.via.filter((item) => typeof item === 'object').forEach((via) => {
        advisories.push({
          module  : v.name,
          severity: v.severity,
          title   : via.title || 'No title',
          url     : via.url   || '',
          range   : via.range || '',
        });
      });
    });
  }

  return {
    vulnerabilities: total,
    critical: meta.critical || 0,
    high    : meta.high     || 0,
    moderate: meta.moderate || 0,
    low     : meta.low      || 0,
    info    : meta.info     || 0,
    advisories,
  };
}

// ── yarn audit NDJSON parser ──────────────────────────────────────────────────
function parseYarnAudit(lines) {
  const summary = lines.find((l) => l.type === 'auditSummary')?.data || {};
  const total   =
    (summary.vulnerabilities?.critical || 0) +
    (summary.vulnerabilities?.high     || 0) +
    (summary.vulnerabilities?.moderate || 0) +
    (summary.vulnerabilities?.low      || 0) +
    (summary.vulnerabilities?.info     || 0);

  const advisories = lines
    .filter((l) => l.type === 'auditAdvisory')
    .map((l) => ({
      module  : l.data?.resolution?.path?.split('>')[0]?.trim() || l.data?.advisory?.module_name || '?',
      severity: l.data?.advisory?.severity || 'unknown',
      title   : l.data?.advisory?.title    || 'No title',
      url     : l.data?.advisory?.url      || '',
      range   : l.data?.advisory?.vulnerable_versions || '',
    }));

  return {
    vulnerabilities: total,
    critical: summary.vulnerabilities?.critical || 0,
    high    : summary.vulnerabilities?.high     || 0,
    moderate: summary.vulnerabilities?.moderate || 0,
    low     : summary.vulnerabilities?.low      || 0,
    info    : summary.vulnerabilities?.info     || 0,
    advisories,
  };
}

// ── Report printer ────────────────────────────────────────────────────────────
function printReport(report) {
  divider('Security Audit Report');

  if (report.vulnerabilities === 0) {
    console.log(boxen(
      `${chalk.green('✔')}  ${chalk.bold.green('No vulnerabilities found!')}\n` +
      chalk.gray('  Your project dependencies are clean.'),
      { padding: 1, borderColor: 'green', borderStyle: 'round' }
    ));
    return;
  }

  const table = new Table({
    head: [chalk.bold.cyan('Severity'), chalk.bold.cyan('Count')],
    colWidths: [15, 10],
    style: { border: ['gray'], head: [] },
  });

  [
    [chalk.red.bold('critical'), report.critical],
    [chalk.red('high'),          report.high],
    [chalk.yellow('moderate'),   report.moderate],
    [chalk.blue('low'),          report.low],
    [chalk.gray('info'),         report.info],
  ].filter(([, count]) => count > 0).forEach(([sev, count]) => table.push([sev, String(count)]));

  console.log(table.toString());
  console.log(chalk.gray(`  Total vulnerabilities: ${chalk.red.bold(report.vulnerabilities)}\n`));

  if (report.advisories?.length > 0) {
    const seen   = new Set();
    const unique = report.advisories.filter(({ module: m, title: t }) => {
      const key = `${m}:${t}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    divider('Vulnerability Details');
    unique.slice(0, 20).forEach((adv, i) => {
      const sev =
        adv.severity === 'critical' ? chalk.red.bold(adv.severity.toUpperCase()) :
        adv.severity === 'high'     ? chalk.red(adv.severity.toUpperCase())      :
        adv.severity === 'moderate' ? chalk.yellow(adv.severity.toUpperCase())   :
                                      chalk.blue(adv.severity.toUpperCase());
      console.log(`  ${sev.padEnd(20)} ${chalk.white(adv.module)}  ${chalk.gray('— ' + adv.title)}`);
      if (adv.range) step(`Vulnerable range: ${adv.range}`);
      if (adv.url)   step(`More info: ${chalk.underline(adv.url)}`);
      if (i < unique.length - 1) console.log();
    });
    if (unique.length > 20) {
      console.log(chalk.gray(`  … and ${unique.length - 20} more.\n`));
    }
  }
}

// ── Command ───────────────────────────────────────────────────────────────────
export default async function audit(options) {
  const pkg = readPkg();
  if (!pkg) {
    error('No package.json found. Run ' + chalk.cyan('pkgman init') + ' first.');
    return;
  }

  // If --yarn requested but yarn isn't installed, fall back to npm
  if (options.yarn && !hasYarn()) {
    warn('Yarn not found — falling back to npm.');
    options.yarn = false;
  }

  const manager = options.yarn ? 'yarn' : 'npm';
  info(`Running security audit with ${chalk.bold(manager)}…`);
  console.log();

  // Optional auto-fix (npm only)
  if (options.fix) {
    if (manager === 'yarn') {
      warn('Yarn does not support audit --fix. Run ' + chalk.cyan('npm audit fix') + ' manually.');
    } else {
      warn('Running automated fix…');
      try {
        await withSpinner('Applying fixes…', async (spinner) => {
          spinner.stop();
          await run(manager, ['audit', 'fix']);
          spinner.succeed(chalk.green('Fix complete'));
        });
      } catch {
        warn('Some vulnerabilities could not be fixed automatically.');
      }
      console.log();
    }
  }

  // Run audit and parse output
  let report;
  await withSpinner('Analysing dependencies…', async (spinner) => {
    try {
      if (manager === 'yarn') {
        const lines = await runNDJSON('yarn', ['audit', '--json']);
        report = parseYarnAudit(lines);
      } else {
        let raw;
        try {
          raw = await runJSON('npm', ['audit', '--json']);
        } catch (err) {
          // npm audit exits 1 when vulnerabilities are found — stdout still has JSON
          if (err.stdout) raw = JSON.parse(err.stdout);
          else throw err;
        }
        report = parseNpmAudit(raw);
      }
      spinner.succeed('Audit complete');
    } catch (err) {
      spinner.fail('Audit command failed');
      error(err.message);
      process.exit(1);
    }
  });

  if (!report) {
    warn('Could not parse audit output. Try running ' + chalk.cyan('npm audit') + ' directly.');
    return;
  }

  printReport(report);

  if (report.vulnerabilities > 0 && !options.fix && manager === 'npm') {
    console.log();
    info(`Run ${chalk.cyan('pkgman audit --fix')} to attempt automatic fixes.`);
  }
}
