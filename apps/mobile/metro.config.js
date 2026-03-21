const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules: root node_modules first (avoids duplicate React)
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Redirect react/react-dom/scheduler to root copies only
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      if (['react', 'react-dom', 'scheduler'].includes(name)) {
        return path.resolve(monorepoRoot, 'node_modules', name);
      }
      return path.resolve(monorepoRoot, 'node_modules', name);
    },
  }
);

module.exports = config;
