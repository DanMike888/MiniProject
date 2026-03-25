import fs   from 'fs';
import path  from 'path';

const PKG_FILE = 'package.json';

export function readPkg(cwd = process.cwd()) {
  const pkgPath = path.join(cwd, PKG_FILE);
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return null;
  }
}

export function writePkg(data, cwd = process.cwd()) {
  const pkgPath = path.join(cwd, PKG_FILE);
  fs.writeFileSync(pkgPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function getInstalledPkgInfo(pkgName, cwd = process.cwd()) {
  const modulePkgPath = path.join(cwd, 'node_modules', pkgName, 'package.json');
  if (!fs.existsSync(modulePkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(modulePkgPath, 'utf8'));
  } catch {
    return null;
  }
}

export function listPackages(cwd = process.cwd(), filter = 'all') {
  const pkg = readPkg(cwd);
  if (!pkg) return [];

  const entries = [];
  const addGroup = (deps, type) => {
    if (!deps) return;
    Object.entries(deps).forEach(([name, range]) => {
      const info = getInstalledPkgInfo(name, cwd);
      entries.push({
        name,
        version       : info ? info.version : range,
        specifiedRange: range,
        type,
        description   : info ? (info.description || '') : '',
      });
    });
  };

  if (filter === 'all' || filter === 'prod') addGroup(pkg.dependencies,    'dependency');
  if (filter === 'all' || filter === 'dev')  addGroup(pkg.devDependencies, 'devDependency');
  return entries;
}

function buildTreeNode(pkgName, version, cwd, maxDepth, currentDepth = 0) {
  const node = { name: pkgName, version, deps: [] };
  if (currentDepth >= maxDepth) return node;

  const info = getInstalledPkgInfo(pkgName, cwd);
  if (!info || !info.dependencies) return node;

  Object.entries(info.dependencies).forEach(([depName, depRange]) => {
    const depInfo = getInstalledPkgInfo(depName, cwd);
    node.deps.push(
      buildTreeNode(depName, depInfo ? depInfo.version : depRange, cwd, maxDepth, currentDepth + 1)
    );
  });
  return node;
}

export function buildDependencyTree(cwd = process.cwd(), maxDepth = 2) {
  const pkg = readPkg(cwd);
  if (!pkg) return null;

  const root = { name: pkg.name || 'project', version: pkg.version || '0.0.0', deps: [] };
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  Object.entries(allDeps).forEach(([name, range]) => {
    const info = getInstalledPkgInfo(name, cwd);
    root.deps.push(buildTreeNode(name, info ? info.version : range, cwd, maxDepth, 1));
  });
  return root;
}
