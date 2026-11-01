# seecode-analysis · SeeCode 分析档案

用 SeeCode 的 45 种交互图表为开源项目建立"结构解剖"档案。每份分析是独立仓库，以 git submodule 形式挂在本项目下，统一构建成一个可浏览的静态站点。

**在线浏览：<https://ruijh.github.io/seecode-analysis/>**

## 当前子项目

| 子项目 | 分析对象 | 图表 |
|---|---|---|
| [deepseek-harness-analysis](https://github.com/ruijh/deepseek-harness-analysis) | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | 60 |
| [deer-flow-analysis](https://github.com/ruijh/deer-flow-analysis) | [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | 45 |
| [cubesandbox-analysis](projects/cubesandbox-analysis/)（完整子项目） | [TencentCloud/CubeSandbox](https://github.com/TencentCloud/CubeSandbox) | 47 |
| [mission-control-analysis](projects/mission-control-analysis/)（完整子项目） | [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) | 49 |

## 目录结构

```
seecode-analysis/
├── index.html            ← 由构建脚本生成（门户首页）
├── projects.json         ← 子项目清单（站点数据的唯一来源）
├── projects/
│   ├── mission-control-analysis/   ← 完整子项目：内容直接并入本仓库
│   └── (其它分析仓库)              ← git submodule 引用
├── scripts/
│   ├── build-site.mjs    ← 构建：扫描子模块 docs/*.html → dist/
│   └── add-project.mjs   ← 一键新增子项目
└── .github/workflows/deploy.yml  ← push 即部署 GitHub Pages
```

子项目有两种形态：**完整子项目**（内容并入，clone 即得，GitHub 上可直接浏览）和 **submodule**（引用独立仓库）。新增默认走 submodule（`add-project.mjs`）；要把某个 submodule 转为完整子项目：`git submodule deinit -f projects/<id> && git rm -f projects/<id>`，再把仓库内容拷入该目录即可，构建脚本无需改动。

## 新增一份分析

用 SeeCode 完成一次开源项目分析并推送成 `xxx-analysis` 仓库后：

```bash
node scripts/add-project.mjs https://github.com/ruijh/xxx-analysis "项目名" "一句话描述"
```

脚本会自动：添加 submodule → 登记进 projects.json → 本地构建验证 → 提交推送。push 触发 GitHub Actions 重新部署，新项目即出现在档案首页。

## 本地预览

```bash
git clone --recurse-submodules https://github.com/ruijh/seecode-analysis.git
cd seecode-analysis
node scripts/build-site.mjs
npx serve dist   # 或 python -m http.server -d dist 8000
```
