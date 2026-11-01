#!/usr/bin/env node
// 构建 SeeCode 分析档案静态站点：
//   读取 projects.json → 复制每个子项目的 docs/*.html → 生成门户首页和每个子项目的图表索引页 → dist/
// 用法：node scripts/build-site.mjs

import { readFile, writeFile, mkdir, readdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const manifest = JSON.parse(await readFile(path.join(root, 'projects.json'), 'utf8'));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CSS = `
:root {
  --paper: #fafaf8;
  --ink: #1b1a16;
  --muted: #6f6d64;
  --line: #d9d7cd;
  --cobalt: #1f3ac2;
  --serif: "Noto Serif SC", "Songti SC", "SimSun", serif;
  --sans: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --mono: ui-monospace, "Cascadia Code", Consolas, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 62rem; margin: 0 auto; padding: 0 1.5rem 5rem; }
a { color: inherit; }
a:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 3px; }
.crumb { font-family: var(--mono); font-size: .8rem; color: var(--muted); padding-top: 2.2rem; }
.crumb a { text-decoration: none; }
.crumb a:hover { color: var(--cobalt); }
.hero { padding: 4.5rem 0 3.5rem; animation: rise .7s ease both; }
.hero h1 {
  font-family: var(--serif);
  font-weight: 900;
  font-size: clamp(2.8rem, 7vw, 5.2rem);
  line-height: 1.18;
  letter-spacing: .02em;
  max-width: 14em;
}
.hero p { margin-top: 1.4rem; color: var(--muted); max-width: 34em; }
.hero .cobalt { color: var(--cobalt); }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .hero { animation: none; } }

.rows { border-top: 1px solid var(--line); }
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .4rem 3rem;
  padding: 2rem 0 2.2rem;
  border-bottom: 1px solid var(--line);
}
.row h2 { font-family: var(--serif); font-size: 1.7rem; font-weight: 700; line-height: 1.3; }
.row h2 a { text-decoration: none; }
.row h2 a:hover { color: var(--cobalt); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
.row .desc { color: var(--muted); max-width: 36em; margin-top: .2rem; }
.row .meta { text-align: right; font-size: .85rem; color: var(--muted); display: flex; flex-direction: column; gap: .3rem; align-items: flex-end; }
.row .meta .count { font-family: var(--mono); color: var(--ink); }
.row .meta a { text-decoration: none; border-bottom: 1px solid var(--line); }
.row .meta a:hover { color: var(--cobalt); border-color: var(--cobalt); }
.footer { margin-top: 4rem; color: var(--muted); font-size: .9rem; max-width: 40em; }
.footer code { font-family: var(--mono); font-size: .82em; background: #f0efe9; padding: .1em .4em; border-radius: 3px; }
.footer a { color: var(--cobalt); }
@media (max-width: 640px) {
  .row { grid-template-columns: 1fr; }
  .row .meta { text-align: left; align-items: flex-start; flex-direction: row; gap: 1.2rem; flex-wrap: wrap; }
}

.proj-head { padding: 3.5rem 0 2.5rem; }
.proj-head h1 { font-family: var(--serif); font-weight: 900; font-size: clamp(2.2rem, 5vw, 3.6rem); line-height: 1.25; }
.proj-head .sub { color: var(--muted); margin-top: .8rem; max-width: 40em; }
.proj-head .links { margin-top: 1.2rem; display: flex; gap: 1.6rem; font-size: .9rem; flex-wrap: wrap; }
.proj-head .links a { text-decoration: none; border-bottom: 1px solid var(--line); padding-bottom: 1px; }
.proj-head .links a:hover { color: var(--cobalt); border-color: var(--cobalt); }
.diagrams { border-top: 1px solid var(--line); padding-top: .6rem; columns: 2; column-gap: 4rem; }
@media (max-width: 720px) { .diagrams { columns: 1; } }
.diagrams li { list-style: none; break-inside: avoid; border-bottom: 1px solid var(--line); }
.diagrams a {
  display: flex; gap: .9rem; align-items: baseline;
  padding: .65rem 0; text-decoration: none; font-size: .95rem;
}
.diagrams a:hover .t { color: var(--cobalt); text-decoration: underline; text-underline-offset: 4px; }
.diagrams .n { font-family: var(--mono); font-size: .75rem; color: var(--muted); min-width: 1.6em; }
`;

const head = (title, desc) => `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
`;

const portalPage = (m, projects) => `${head(m.title, m.description)}
<body>
<div class="wrap">
  <p class="crumb">seecode-analysis</p>
  <header class="hero">
    <h1>开源项目<br><span class="cobalt">结构解剖</span>档案</h1>
    <p>${esc(m.description)}</p>
  </header>
  <main class="rows">
${projects.map((p) => `    <section class="row">
      <div>
        <h2><a href="projects/${esc(p.id)}/index.html">${esc(p.name)}</a></h2>
        <p class="desc">${esc(p.description)}</p>
      </div>
      <div class="meta">
        <span class="count">${p.count} 张图</span>
        <a href="${esc(p.upstreamUrl)}" target="_blank" rel="noopener">${esc(p.upstream)}</a>
        <a href="${esc(p.repoUrl)}" target="_blank" rel="noopener">分析源码仓库</a>
      </div>
    </section>`).join('\n')}
  </main>
  <footer class="footer">
    <p>持续增补中：每份 SeeCode 分析都是独立仓库，作为子项目挂在本档案下。新增方式见<a href="https://github.com/ruijh/seecode-analysis" target="_blank" rel="noopener">项目说明</a>，或运行 <code>node scripts/add-project.mjs &lt;仓库地址&gt;</code>。</p>
  </footer>
</div>
</body>
</html>
`;

const projectPage = (p, diagrams, m) => `${head(`${p.name} · ${m.title}`, p.description)}
<body>
<div class="wrap">
  <p class="crumb"><a href="../../index.html">← 返回档案</a></p>
  <header class="proj-head">
    <h1>${esc(p.name)}</h1>
    <p class="sub">${esc(p.description)} 共 ${diagrams.length} 张可交互图表：悬停查看细节，支持动画回放与镜头追踪。</p>
    <div class="links">
      <a href="${esc(p.upstreamUrl)}" target="_blank" rel="noopener">上游项目 ${esc(p.upstream)}</a>
      <a href="${esc(p.repoUrl)}" target="_blank" rel="noopener">分析源码仓库</a>
    </div>
  </header>
  <ul class="diagrams">
${diagrams.map((d, i) => `    <li><a href="docs/${esc(d.file)}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(d.title)}</span></a></li>`).join('\n')}
  </ul>
</div>
</body>
</html>
`;

await rm(dist, { recursive: true, force: true });

const built = [];
for (const p of manifest.projects) {
  const srcDocs = path.join(root, 'projects', p.id, 'docs');
  if (!existsSync(srcDocs)) {
    console.error(`✗ ${p.id}: projects/${p.id}/docs 不存在，跳过（先 git submodule add）`);
    continue;
  }
  const outBase = path.join(dist, 'projects', p.id);
  await mkdir(path.join(outBase, 'docs'), { recursive: true });
  const files = (await readdir(srcDocs)).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== 'demo.html').sort();
  const diagrams = [];
  for (const f of files) {
    await copyFile(path.join(srcDocs, f), path.join(outBase, 'docs', f));
    const html = await readFile(path.join(srcDocs, f), 'utf8');
    const m = html.match(/<title>([^<]*)<\/title>/i);
    diagrams.push({ file: f, title: m ? m[1].trim() : f.replace(/\.html$/, '') });
  }
  // 画廊页（docs/index.html）的缩略图引用同名 PNG，一并拷贝
  for (const f of (await readdir(srcDocs)).filter((f) => f.endsWith('.png'))) {
    await copyFile(path.join(srcDocs, f), path.join(outBase, 'docs', f));
  }
  const gallery = path.join(srcDocs, 'index.html');
  if (existsSync(gallery)) await copyFile(gallery, path.join(outBase, 'docs', 'index.html'));
  const demo = path.join(srcDocs, 'demo.html');
  if (existsSync(demo)) await copyFile(demo, path.join(outBase, 'docs', 'demo.html'));
  await writeFile(path.join(outBase, 'index.html'), projectPage(p, diagrams, manifest));
  built.push({ ...p, count: diagrams.length });
  console.log(`✓ ${p.id}: ${diagrams.length} 张图`);
}

await writeFile(path.join(dist, 'index.html'), portalPage(manifest, built));
console.log(`\n构建完成 → dist/（${built.length} 个子项目，${built.reduce((n, p) => n + p.count, 0)} 张图）`);
