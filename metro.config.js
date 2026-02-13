// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude backend directory from bundling
config.resolver.blockList = [
  // Exclude backend directory
  /backend\/.*/,
  // Exclude node_modules in backend
  /backend\/node_modules\/.*/,
];

// Also exclude from watchFolders if needed
config.watchFolders = config.watchFolders || [];
config.watchFolders = config.watchFolders.filter(
  (folder) => !folder.includes('/backend')
);

module.exports = config;

