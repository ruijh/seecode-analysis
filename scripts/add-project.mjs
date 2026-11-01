#!/usr/bin/env node
// 把一份 SeeCode 分析仓库作为子项目加入本档案：
//   node scripts/add-project.mjs <仓库地址> [显示名] [一句话描述]
// 默认以"完整子项目"方式并入：clone → 拷贝内容进 projects/<id>/ → 登记 projects.json → 构建验证 → 提交推送。
// 如需保留 submodule 引用（不推荐），加 --submodule。

import { readFile, writeFile, mkdtemp, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const asSubmodule = process.argv.includes('--submodule');
const [url, name, description] = process.argv.slice(2).filter((a) => a !== '--submodule');

if (!url) {
  console.error('用法：node scripts/add-project.mjs <仓库地址> [显示名] [一句话描述] [--submodule]');
  process.exit(1);
}
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/.test(url)) {
  console.error(`✗ 不是合法的 GitHub 仓库地址：${url}`);
  process.exit(1);
}

const id = path.basename(url, '.git');
const repoPath = url.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
const displayName = name || id.replace(/-analysis$/, '');
const dest = path.join(root, 'projects', id);

if (existsSync(dest)) {
  console.error(`✗ projects/${id} 已存在`);
  process.exit(1);
}

if (asSubmodule) {
  console.log(`以 submodule 引用 ${repoPath}…`);
  execSync(`git submodule add "${url}" "projects/${id}"`, { cwd: root, stdio: 'inherit' });
} else {
  console.log(`以完整子项目并入 ${repoPath}…`);
  const tmp = await mkdtemp(path.join(tmpdir(), 'seecode-add-'));
  try {
    execSync(`git clone --depth 1 "${url}" "${tmp}/repo"`, { cwd: root, stdio: 'inherit' });
    await cp(path.join(tmp, 'repo'), dest, {
      recursive: true,
      filter: (src) => !/(^|[\\/])\.git$|(^|[\\/])\.seecode$/.test(src),
    });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

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
  repoUrl: asSubmodule ? `https://github.com/${repoPath}` : `https://github.com/ruijh/seecode-analysis/tree/main/projects/${id}`,
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
