# seecode-analysis · SeeCode 分析档案

用 SeeCode 的 45 种交互图表为开源项目建立"结构解剖"档案。每份分析是**完整子项目**，内容直接并入本仓库，统一构建成一个可浏览的静态站点。

**在线浏览：<https://ruijh.github.io/seecode-analysis/>**

## 当前子项目（6 个，299 张图）

| 子项目 | 分析对象 | 图表 |
|---|---|---|
| [deepseek-harness-analysis](projects/deepseek-harness-analysis/) | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | 60 |
| [deer-flow-analysis](projects/deer-flow-analysis/) | [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | 45 |
| [cubesandbox-analysis](projects/cubesandbox-analysis/) | [TencentCloud/CubeSandbox](https://github.com/TencentCloud/CubeSandbox) | 47 |
| [mission-control-analysis](projects/mission-control-analysis/) | [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) | 49 |
| [dsh-superagent-prototype-analysis](projects/dsh-superagent-prototype-analysis/) | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | 49 |
| [rea-analysis](projects/rea-analysis/) | [morluto/rea](https://github.com/morluto/rea) | 49 |

## 目录结构

```
seecode-analysis/
├── projects.json         ← 子项目清单（站点数据的唯一来源）
├── projects/<id>/        ← 完整子项目，统一模板：
│   ├── README.md         ← 分析说明与复现步骤
│   ├── docs/             ← 发布物：画廊页 index.html + 每图三元组（.html 交互 / .png 快照 / .json 规格）
│   └── tools/            ← 生成器脚本（可选，有脚本自动复现的子项目才有）
├── scripts/
│   ├── build-site.mjs    ← 构建：扫描各子项目 docs/*.html（含画廊页与 PNG）→ dist/
│   └── add-project.mjs   ← 一键新增子项目（默认并入完整内容）
└── .github/workflows/deploy.yml  ← push 即部署 GitHub Pages
```

子项目一律**内容并入**而非 submodule 引用：clone 一次即得全部内容，GitHub 上可直接浏览，也不会因外部仓库改名/删除而断掉部署（此前 cubesandbox-analysis 被删除就曾中断过 submodule 模式的部署）。

## 新增一份分析

用 SeeCode 完成一次开源项目分析并推送成 `xxx-analysis` 仓库后：

```bash
node scripts/add-project.mjs https://github.com/ruijh/xxx-analysis "项目名" "一句话描述"
```

脚本默认以**完整子项目**方式并入（clone → 拷贝内容 → 登记 projects.json → 本地构建验证 → 提交推送）；如确需 submodule 引用，加 `--submodule`。

## 本地预览

```bash
git clone https://github.com/ruijh/seecode-analysis.git
cd seecode-analysis
node scripts/build-site.mjs
npx serve dist   # 或 python -m http.server -d dist 8000
```
