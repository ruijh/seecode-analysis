#!/usr/bin/env node
// 把一份 SeeCode 分析仓库作为子项目加入本档案：
//   node scripts/add-project.mjs <仓库地址> [显示名] [一句话描述]
// 例：node scripts/add-project.mjs https://github.com/ruijh/lobehub-analysis LobeHub
// 完成后自动提交并推送，GitHub Actions 会重新部署站点。

import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [url, name, description] = process.argv.slice(2);

if (!url) {
  console.error('用法：node scripts/add-project.mjs <仓库地址> [显示名] [一句话描述]');
  process.exit(1);
}
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/.test(url)) {
  console.error(`✗ 不是合法的 GitHub 仓库地址：${url}`);
  process.exit(1);
}

const id = path.basename(url, '.git');
const repoPath = url.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
const displayName = name || id.replace(/-analysis$/, '');

console.log(`添加子项目 ${displayName}（${repoPath}）…`);
execSync(`git submodule add "${url}" "projects/${id}"`, { cwd: root, stdio: 'inherit' });

const manifestPath = path.join(root, 'projects.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.projects.some((p) => p.id === id)) {
  console.error(`✗ projects.json 里已有 ${id}，如需更新请手工编辑`);
  process.exit(1);
}
manifest.projects.push({
  id,
  name: displayName,
  upstream: repoPath.replace(/-analysis$/, ''),
  upstreamUrl: `https://github.com/${repoPath.replace(/-analysis$/, '')}`,
  repoUrl: `https://github.com/${repoPath}`,
  description: description || `SeeCode 全景图表分析。`,
  added: new Date().toISOString().slice(0, 10),
});
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

execSync('node scripts/build-site.mjs', { cwd: root, stdio: 'inherit' });
execSync('git add -A', { cwd: root, stdio: 'inherit' });
execSync(`git commit -m "Add ${displayName} 分析子项目"`, { cwd: root, stdio: 'inherit' });
execSync('git push', { cwd: root, stdio: 'inherit' });

console.log(`\n✓ 已加入并推送。GitHub Actions 部署完成后即可在站点上看到 ${displayName}。`);
console.log('  提示：projects.json 里自动推断的 upstream 和描述可手工润色。');
