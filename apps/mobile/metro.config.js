const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// apps/mobile is a standalone npm project (kept out of root workspaces so
// react-native never enters the Vercel/Next install). Shared code is pulled
// in by watching the packages/ folder directly.
config.watchFolders = [path.resolve(monorepoRoot, 'packages')]
config.resolver.extraNodeModules = {
  '@vidhyaan/shared': path.resolve(monorepoRoot, 'packages/shared/src')
}

module.exports = withNativeWind(config, { input: './global.css' })
