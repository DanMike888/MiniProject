import chalk from 'chalk';
import { error, info, warn, packageTable, dependencyTree } from '../utils/display.js';
import { readPkg, listPackages, buildDependencyTree }       from '../utils/packageUtils.js';

export default function list(options) {
  const pkg = readPkg();
  if (!pkg) {
    error('No package.json found. Run ' + chalk.cyan('pkgman init') + ' first.');
    return;
  }

  if (options.tree) {
    const maxDepth = parseInt(options.depth, 10) || 2;
    const tree     = buildDependencyTree(process.cwd(), maxDepth);
    if (!tree) { error('Could not build dependency tree.'); return; }
    dependencyTree(tree);
    const totalDeps    = Object.keys(pkg.dependencies    || {}).length;
    const totalDevDeps = Object.keys(pkg.devDependencies || {}).length;
    info(`${totalDeps} production dep(s), ${totalDevDeps} dev dep(s)  |  tree depth: ${maxDepth}`);
    return;
  }

  let filter = 'all';
  if (options.dev  && !options.prod) filter = 'dev';
  if (options.prod && !options.dev)  filter = 'prod';

  const packages = listPackages(process.cwd(), filter);
  if (packages.length === 0) {
    warn('No packages found. Have you run ' + chalk.cyan('pkgman install <package>') + '?');
    return;
  }

  const title =
    filter === 'dev'  ? 'Dev Dependencies'       :
    filter === 'prod' ? 'Production Dependencies' :
                        'All Installed Packages';

  packageTable(packages, title);
}
