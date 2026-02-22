const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 모노레포 루트 경로
const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Metro가 모노레포 루트의 패키지를 감시하도록 설정
config.watchFolders = [workspaceRoot];

// Metro의 모듈 해석 경로에 모노레포 루트 추가
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// @airmate/shared → packages/shared/src/index.ts 직접 연결
config.resolver.extraNodeModules = {
  '@airmate/shared': path.resolve(workspaceRoot, 'packages/shared/src/index.ts'),
};

module.exports = config;
