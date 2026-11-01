#!/usr/bin/env node
// 从 docs/*.json 生成卡片式索引页 docs/index.html（风格与其它 *-analysis 仓库一致）
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DIMS = {
  '01': '系统结构', '02': '系统结构', '03': '系统结构', '04': '系统结构', '05': '系统结构', '06': '系统结构', '07': '系统结构', '08': '系统结构', '09': '系统结构',
  '10': '流程过程', '11': '流程过程', '12': '流程过程', '13': '流程过程', '14': '流程过程', '15': '流程过程', '16': '流程过程', '17': '流程过程', '18': '流程过程', '19': '流程过程', '20': '流程过程', '21': '流程过程',
  '22': '数据平台', '23': '数据平台', '24': '数据平台',
  '25': '结构组织', '26': '结构组织', '27': '结构组织', '28': '结构组织', '29': '结构组织', '30': '结构组织', '31': '结构组织', '32': '结构组织', '33': '结构组织', '34': '结构组织', '35': '结构组织', '36': '结构组织',
  '37': '数据图表', '38': '数据图表', '39': '数据图表', '40': '数据图表', '41': '数据图表', '42': '数据图表', '43': '数据图表', '44': '数据图表', '45': '数据图表',
  '46': '系统结构', '47': '流程过程', '48': '流程过程', '49': '数据图表'
};

const files = readdirSync('docs').filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
const dims = new Map();
for (const f of files) {
  const j = JSON.parse(readFileSync(`docs/${f}`, 'utf8'));
  const no = f.slice(0, 2);
  const dim = DIMS[no] || '其他';
  if (!dims.has(dim)) dims.set(dim, []);
  dims.get(dim).push({
    file: f.replace(/\.json$/, '.html'),
    no: f.replace(/\.json$/, '').replace(/-/, ' · '),
    title: j.title, sub: j.subtitle || '', tag: j.type, png: f.replace(/\.json$/, '.png')
  });
}

const section = ([dim, cards]) => `<section><h2>${esc(dim)}</h2><div class="grid">${cards.map((c) => `<a class="card" href="${c.file}"><div class="thumb"><img loading="lazy" src="${c.png}" alt=""></div>
<div class="meta"><div class="no">${esc(c.no)}</div>
<div class="t">${esc(c.title)}</div><div class="s">${esc(c.sub)}</div><span class="tag">${esc(c.tag)}</span></div></a>`).join('')}</div></section>`;

writeFileSync('docs/index.html', `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dsh-superagent · 49 图全方位分析</title>
<style>
:root{color-scheme:light dark}
body{font-family:system-ui,-apple-system,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;margin:0;background:#f6f7f9;color:#1a1d21}
header{padding:48px 32px 24px;max-width:1280px;margin:0 auto}
h1{font-size:28px;margin:0 0 8px}
header p{margin:4px 0;color:#5c6470;font-size:14px;line-height:1.7}
.stats{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0 8px}
.stat{background:#fff;border:1px solid #e3e6ea;border-radius:12px;padding:14px 18px;min-width:130px}
.stat b{display:block;font-size:22px}
.stat span{font-size:12px;color:#697180}
section{max-width:1280px;margin:0 auto;padding:12px 32px}
section h2{font-size:18px;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #dfe3e8}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
a.card{display:block;background:#fff;border:1px solid #e3e6ea;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .12s,box-shadow .12s}
a.card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(20,30,50,.1)}
.thumb{aspect-ratio:16/9;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;border-bottom:1px solid #eef0f3}
.thumb img{width:100%;height:100%;object-fit:cover;object-position:top}
.meta{padding:12px 14px 14px}
.no{font-size:11px;color:#8a93a2;letter-spacing:.4px}
.t{font-weight:600;font-size:14.5px;margin:3px 0 2px}
.s{font-size:12px;color:#697180;line-height:1.5}
.tag{display:inline-block;font-size:10.5px;background:#eef2ff;color:#3b5bdb;border-radius:6px;padding:1px 7px;margin-top:6px;font-family:ui-monospace,monospace}
footer{max-width:1280px;margin:0 auto;padding:28px 32px 60px;color:#8a93a2;font-size:12.5px;line-height:1.8}
footer a{color:inherit}
@media(prefers-color-scheme:dark){body{background:#111418;color:#e8eaed}.stat,a.card{background:#1a1f26;border-color:#2a313b}.stat span,.s,header p{color:#9aa4b2}.no{color:#77808f}section h2{border-color:#2a313b}.thumb{background:#0d1013;border-color:#222833}.tag{background:#232c47;color:#93b0ff}}
</style></head><body>
<header>
<h1>dsh-superagent · 49 种图表全方位分析</h1>
<p>对 <b>github.com/deepseek-ai/dsh-superagent-prototype</b> 的全景解读：45 种核心图表类型 + 4 种变体，每个图表回答一个关于这个仓库的问题。数据来自 2026-11-01 的本地克隆、docs/000-008 九篇编号文档与四路代码深读（上游为单次 squash 发布，无 git 历史图表）。点击任意卡片打开可交互图表（悬停、动画回放、镜头追踪）。</p>
<div class="stats">
<div class="stat"><b>1</b><span>提交（squash 发布）</span></div>
<div class="stat"><b>3.3 万</b><span>总行数</span></div>
<div class="stat"><b>15.0k</b><span>测试行数 ≈ 源码</span></div>
<div class="stat"><b>2</b><span>直接第三方依赖</span></div>
<div class="stat"><b>9</b><span>编号文档</span></div>
<div class="stat"><b>49</b><span>分析图表</span></div>
</div>
</header>
${[...dims].map(section).join('\n')}
<footer>图表由 SeeCode 渲染；<code>docs/*.json</code> 即图表规格，<code>tools/gen49.mjs</code> 为批量生成器。分析合集索引：<a href="https://ruijh.github.io/seecode-analysis/">seecode-analysis</a>。</footer>
</body></html>
`);
console.log(`docs/index.html 生成完毕（${files.length} 张卡片）`);
