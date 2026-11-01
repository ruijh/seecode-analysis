#!/usr/bin/env node
// REA (morluto/rea) · 45 种核心图表 + 4 种变体（共 49 张）批量生成器
// 事实依据：2026-11-01 本地完整克隆的 git 统计（6278 commits）、find+cat 行数统计、
// SC scan 模块依赖矩阵、package.json/server.json/CHANGELOG 与 docs 深读（file:line 见各 spec.evidence）。
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SC = 'node "C:/Users/ruijh/.agents/skills/seecode/scripts/seecode.mjs"';
const EYEBROW = 'REA · 全方位分析';
const LANG = 'zh-CN';
const CAP = '数据来源：github.com/morluto/rea（2026-11-01 本地完整克隆 + git/find 统计）';

const specs = [];
const add = (file, spec) => specs.push({ file, spec });

// ---------- 01 architecture ----------
add('01-architecture', {
  type: 'architecture', title: '总体架构：一个 MCP 打通全栈逆向', subtitle: '双入口 → 应用工作流 → 纯核心 → 引擎/适配器 → 证据回传',
  caption: '端口-适配器分层：domain（30.1 万行）几乎零外部依赖；Hopper/Ghidra/IDA/Kuna 都是可插拔 provider；所有结论汇入 Evidence 以 file:line 回传。',
  budget: 'faithful',
  evidence: [{ id: 'sv', file: 'src/server/createServer.ts', line: 441 }, { id: 'cli', file: 'src/cli.ts', line: 1 }, { id: 'fam', file: 'src/contracts/toolFamilyIds.ts', line: 11 }],
  nodes: [
    { id: 'agent', label: 'AI Agent', sub: 'Claude Code · Cursor · Codex', kind: 'external', row: 1, col: 0 },
    { id: 'mcp', label: 'MCP Server', sub: '18 家族 · 约 240 操作', row: 0, col: 1 },
    { id: 'cli', label: 'CLI', sub: 'rea · 同一服务层', row: 2, col: 1 },
    { id: 'app', label: 'Application', sub: '工作流 · 15.8 万行', focal: true, row: 1, col: 2 },
    { id: 'domain', label: 'Domain', sub: '纯核心 · 30.1 万行', row: 3, col: 2 },
    { id: 'engines', label: 'Decompilers', sub: 'Hopper · Ghidra · IDA · Kuna', row: 1, col: 3 },
    { id: 'adapters', label: 'Target Adapters', sub: '36 类目标 · 静态+运行时', row: 2, col: 3 },
    { id: 'evidence', label: 'Evidence', sub: 'file:line · SHA-256 锚定', focal: true, row: 1, col: 4 },
    { id: 'target', label: 'Local Target', sub: '二进制 · 应用 · 网站 · 设备', row: 3, col: 4 }
  ],
  edges: [
    ['agent', 'mcp', 'MCP tools', 'primary'],
    ['agent', 'cli', 'npx rea-agents'],
    ['mcp', 'app', '调用工作流', 'primary'],
    ['cli', 'app', '同一套工作流'],
    ['app', 'domain', '分析规则'],
    ['app', 'engines', '驱动桥接'],
    ['app', 'adapters', '静态/运行时检查'],
    ['engines', 'target', 'bridge 脚本'],
    ['adapters', 'target', '读取/观测'],
    ['app', 'evidence', '生成引用', 'primary'],
    ['evidence', 'agent', '结论+证据回传', 'primary']
  ]
});

// ---------- 02 high-level ----------
add('02-high-level', {
  type: 'high-level', title: 'REA 是什么', subtitle: '给非工程师的 30 秒版本',
  caption: CAP,
  nodes: [
    { id: 'you', label: '你', sub: '看到一个好功能', kind: 'external', row: 1, col: 0 },
    { id: 'rea', label: 'REA', sub: '逆向翻译官', focal: true, row: 1, col: 1 },
    { id: 'tgt', label: '目标应用', sub: '没有源码', kind: 'external', row: 1, col: 2 },
    { id: 'ev', label: '证据链', sub: 'file:line + 字节坐标', row: 0, col: 2 },
    { id: 'out', label: '复刻实现', sub: '在你的项目里', kind: 'external', row: 2, col: 1 }
  ],
  edges: [
    ['you', 'rea', '提问'],
    { from: 'rea', to: 'tgt', label: '无源码检查', kind: 'primary' },
    { from: 'tgt', to: 'ev', label: '留下证据' },
    { from: 'ev', to: 'rea', label: '交叉验证', kind: 'primary' },
    ['rea', 'out', '解释并复刻']
  ]
});

// ---------- 03 deployment ----------
add('03-deployment', {
  type: 'deployment', title: '跑在哪里：三种使用形态', subtitle: 'MCP 注册 / 全局 CLI / agentenv RL 环境',
  caption: '依据 README Quick start 与 installation 文档：一条 npx 命令完成注册并备份已有配置；原生分析复用已装的 Hopper/Ghidra/IDA/Kuna。',
  budget: 'faithful',
  evidence: [{ id: 'qs', file: 'README.md', line: 81 }],
  groups: [
    { id: 'host', label: '你的机器（Node 22+）', style: 'dashed' },
    { id: 'ext', label: '外置工具（可选，用户自备）' }
  ],
  nodes: [
    { id: 'agent', label: 'AI Agent', sub: 'Claude Code/Codex/Cursor…', kind: 'external', row: 1, col: 0 },
    { id: 'mcp', label: 'rea-agents MCP', sub: 'npx rea-agents setup 注册', group: 'host', focal: true, row: 1, col: 1 },
    { id: 'cli', label: 'rea CLI', sub: 'npm i -g rea-agents', group: 'host', row: 2, col: 1 },
    { id: 'env', label: 'agentenv', sub: 'RL 环境构建（6.8）', group: 'host', row: 0, col: 1 },
    { id: 'prov', label: '反编译引擎', sub: 'Hopper/Ghidra/IDA/Kuna', group: 'ext', row: 1, col: 3 },
    { id: 'tools', label: '调用方工具', sub: 'JADX · WABT · pwntools · tshark', group: 'ext', row: 2, col: 3 },
    { id: 'tgt', label: '分析目标', sub: '本地路径/ASAR/APK/设备', kind: 'external', row: 2, col: 2 }
  ],
  edges: [
    { from: 'agent', to: 'mcp', label: 'stdio/HTTP', kind: 'primary' },
    ['agent', 'cli', '终端直用'],
    ['mcp', 'tgt', '只读检查'],
    ['cli', 'tgt'],
    ['mcp', 'prov', '按需启动'],
    ['cli', 'tools', '调用'],
    ['env', 'mcp', '工具即动作空间']
  ]
});

// ---------- 04 dependency ----------
add('04-dependency', {
  type: 'dependency', dir: 'TB', title: '模块依赖（自上而下）', subtitle: '入口 → 应用工作流 → 纯核心 → 接缝层',
  caption: '依赖方向依据 SC scan 的目录级 import 统计；composition 仅 1163 行却把 41 个文件全接起来——依赖注入根。',
  budget: 'faithful',
  nodes: [
    { id: 'cli', label: 'src/cli', sub: '83 文件 · 命令注册', row: 0, col: 0 },
    { id: 'srv', label: 'src/server', sub: '142 文件 · MCP 外壳', row: 0, col: 2 },
    { id: 'comp', label: 'src/composition', sub: '41 文件 · 1163 行 DI 根', row: 0, col: 4 },
    { id: 'app', label: 'src/application', sub: '567 文件 · 工作流', focal: true, row: 1, col: 2 },
    { id: 'dom', label: 'src/domain', sub: '1190 文件 · 30.1 万行纯核心', focal: true, row: 2, col: 1 },
    { id: 'ctr', label: 'src/contracts', sub: '工具契约与 schema', row: 2, col: 3 },
    { id: 'art', label: 'src/artifacts', sub: '证据与工件', row: 3, col: 0 },
    { id: 'prc', label: 'src/process', sub: '进程/PTY 接缝', row: 3, col: 2 },
    { id: 'prov', label: 'providers', sub: 'ghidra/hopper/ida/kuna/native…', row: 3, col: 4 }
  ],
  edges: [
    ['cli', 'app'], ['srv', 'app', 'primary'], ['comp', 'app'],
    { from: 'app', to: 'dom', kind: 'primary' }, ['app', 'ctr'], ['app', 'art'], ['app', 'prc'],
    ['srv', 'dom'], ['cli', 'dom'],
    ['prov', 'dom'], ['art', 'dom'], ['ctr', 'dom']
  ]
});

// ---------- 05 architecture-delta ----------
add('05-architecture-delta', {
  type: 'architecture-delta', title: '6.x 架构增量：摘要化与规模化', subtitle: '从"完整输出"走向"保留事实 + 按需取用"',
  caption: '依据 CHANGELOG 6.8.0 与 docs/mcp-contracts.md：analyze_function 默认改 retained summary；schema/输出均可压缩；新增 RL 环境与一批格式。',
  evidence: [{ id: 'cl', file: 'CHANGELOG.md', line: 3 }],
  nodes: [
    { id: 'base', label: '6.0 工具目录', sub: '全量 inline 输出', change: 'changed', row: 1, col: 0 },
    { id: 'sum', label: 'retained summaries', sub: 'analyze_function 默认摘要', change: 'added', focal: true, row: 1, col: 1 },
    { id: 'view', label: 'analysis view', sub: '按 collection/fields 取页', change: 'added', row: 2, col: 1 },
    { id: 'in', label: 'compact 输入 schema', sub: 'REA_MCP_INPUT_SCHEMA_PROFILE', change: 'added', row: 0, col: 2 },
    { id: 'out', label: 'JSONL 行输出', sub: '--format jsonl 分帧', change: 'added', row: 2, col: 2 },
    { id: 'env', label: 'agentenv', sub: '从捕获/提示建 RL 环境', change: 'added', row: 0, col: 3 },
    { id: 'fmt', label: '新格式族', sub: 'GPU · BEAM · IL2CPP · Godot · PyInstaller · SEA', change: 'added', row: 1, col: 3 },
    { id: 'ev', label: 'Evidence 契约', sub: '可携带 bundle', change: 'changed', row: 1, col: 4 }
  ],
  edges: [
    { from: 'base', to: 'sum', label: '默认摘要化', change: 'added', kind: 'primary' },
    { from: 'sum', to: 'view', change: 'added' },
    { from: 'in', to: 'sum', label: '省上下文' },
    { from: 'out', to: 'base', label: '替代整文档' },
    { from: 'env', to: 'ev', change: 'added' },
    { from: 'fmt', to: 'view', change: 'added' },
    { from: 'sum', to: 'ev', label: '保留事实 16 MiB 上限' }
  ]
});

// ---------- 06 it-state ----------
add('06-it-state', {
  type: 'it-state', title: '子系统健康度', subtitle: '内置面非常稳，外围依赖面如实标注',
  caption: '状态为分析性判断：ok=内置/有测试与 CI real-* 矩阵护航；risk=依赖用户自备工具或实验性（Windows Ghidra P0）。',
  budget: 'faithful',
  nodes: [
    { id: 'dom', label: 'Domain 核心', sub: '30.1 万行 · 近零依赖', status: 'ok', focal: true, row: 0, col: 1 },
    { id: 'fmt', label: '内置静态格式', sub: '36 类目标里的零依赖项', status: 'ok', row: 0, col: 2 },
    { id: 'srv', label: 'server/cli 入口', sub: '同一服务层 · 契约校验', status: 'ok', row: 1, col: 0 },
    { id: 'evd', label: 'Evidence 管线', sub: 'SHA-256 锚定 + bundle', status: 'ok', row: 1, col: 2 },
    { id: 'nat', label: '原生反编译', sub: 'Hopper/Ghidra/IDA/Kuna 外置', status: 'risk', row: 1, col: 3 },
    { id: 'mob', label: '移动/设备面', sub: 'JADX+JDK · adb 自备', status: 'risk', row: 2, col: 3 },
    { id: 'web', label: '浏览器观测', sub: '需 Chrome 族浏览器', status: 'risk', row: 2, col: 0 },
    { id: 'wgh', label: 'Windows Ghidra', sub: 'experimental P0 · DOS 分析', status: 'risk', row: 2, col: 2 }
  ],
  edges: [
    ['srv', 'dom'], ['fmt', 'dom'], ['evd', 'dom'], ['nat', 'dom'], ['mob', 'nat'], ['web', 'dom'], ['wgh', 'nat']
  ]
});

// ---------- 07 uml-class ----------
add('07-uml-class', {
  type: 'uml-class', dir: 'TB', title: '核心接口：注册、准入与证据', subtitle: 'createServer 的装配骨架',
  caption: '依据 src/server/createServer.ts:441/715 与 src/contracts/toolFamilyIds.ts：18 个家族经 registerToolFamilies 注册，准入层控制单活跃 inspection 与预算。',
  evidence: [{ id: 'sv', file: 'src/server/createServer.ts', line: 715 }, { id: 'fam', file: 'src/contracts/toolFamilyIds.ts', line: 11 }],
  nodes: [
    { id: 'sv', label: 'createServer', tag: '«441 行起»', focal: true, methods: ['createServer(options)', 'createMcpServer()', 'registerToolFamilies(map)'], row: 0, col: 1 },
    { id: 'fam', label: 'TOOL_FAMILY_IDS', tag: '«18 家族»', methods: ['direct/enhanced/native…', 'isToolFamilyId()'], row: 1, col: 0 },
    { id: 'ctr', label: '*ToolContracts', tag: '«约 240 操作»', methods: ['z.literal 操作名', 'compact/complete schema'], row: 1, col: 2 },
    { id: 'adm', label: 'analysisAdmission', methods: ['withAdmittedAnalysis()', '单活跃 inspection', '512MiB/16MiB 预算'], row: 2, col: 1 },
    { id: 'ev', label: 'Evidence 记录', methods: ['recordEvidence()', 'evidenceById()', 'export bundle'], row: 3, col: 2 },
    { id: 'br', label: 'ProviderBridge', tag: '«外置引擎»', methods: ['启动 owned 子进程', 'hopper_bridge.py 等'], row: 3, col: 0 }
  ],
  edges: [
    { from: 'sv', to: 'fam', label: '逐家族注册', kind: 'primary' },
    { from: 'sv', to: 'ctr', label: 'advertise tools/list', kind: 'primary' },
    ['ctr', 'adm', '调用前准入'],
    ['adm', 'ev', '记录'],
    ['adm', 'br', '按需启动'],
    ['fam', 'sv', '', 'implements']
  ]
});

// ---------- 08 er ----------
add('08-er', {
  type: 'er', title: '证据数据模型', subtitle: 'Evidence 把"结论"钉回"字节"',
  caption: '依据 docs/mcp-contracts.md 与 docs/gpu-code-objects.md：Evidence 携带文件坐标或容器内坐标，SHA-256 变更即拒绝解析。',
  evidence: [{ id: 'gpu', file: 'docs/gpu-code-objects.md', line: 19 }],
  nodes: [
    { id: 'ev', label: 'Evidence', fields: ['id PK', 'kind', 'sha256 锚', 'location*'], focal: true, row: 0, col: 1 },
    { id: 'loc', label: 'Location', fields: ['file:line | 容器坐标', 'container_id*'], row: 1, col: 0 },
    { id: 'obj', label: 'Object', fields: ['object_id', 'codec 声明', 'encoded/decoded 范围'], row: 1, col: 2 },
    { id: 'txt', label: 'RetainedText', fields: ['UTF-16 offset/limit', 'SHA-256'], row: 2, col: 2 },
    { id: 'view', label: 'AnalysisView', fields: ['collection', 'fields 选择', '分页 cursor'], row: 2, col: 0 },
    { id: 'bundle', label: 'EvidenceBundle', fields: ['portable 导出', '离线可复读'], row: 3, col: 1 }
  ],
  edges: [
    { from: 'ev', to: 'loc', label: '钉回位置', kind: 'primary' },
    { from: 'ev', to: 'obj', label: '引用对象', kind: 'primary' },
    ['obj', 'txt', '解码文本'],
    ['ev', 'view', '按页取读'],
    ['ev', 'bundle', '打包外带', 'many-one']
  ]
});

// ---------- 09 db-schema ----------
add('09-db-schema', {
  type: 'db-schema', title: 'REA 没有数据库：证据即数据', subtitle: 'Evidence 工件 JSON 契约的关系化投影',
  caption: 'REA 不落任何业务库（对照 README 全文）；下表为 Evidence/对象契约的字段投影，来源 docs/mcp-contracts.md 与 gpu-code-objects.md。',
  evidence: [{ id: 'mc', file: 'docs/mcp-contracts.md', line: 1740 }],
  nodes: [
    { id: 'e', label: 'evidence', focal: true, fields: [['id', 'TEXT', 'PK ev_…'], ['kind', 'TEXT', ''], ['source', 'JSON', 'retained-evidence'], ['location', 'JSON', 'file:line|容器'], ['sha256', 'TEXT', '输入锚']] },
    { id: 'o', label: 'gpu_object', fields: [['object_id', 'TEXT', 'PK 位置性'], ['target', 'TEXT', '声明'], ['payload_target', 'TEXT', '实测'], ['codec', 'TEXT', 'lz4/zstd/zlib'], ['consistency', 'TEXT', '枚举']] },
    { id: 'p', label: 'retained_ptx', fields: [['evidence_id', 'TEXT', 'FK'], ['byte_length', 'INT', ''], ['sha256', 'TEXT', ''], ['offset/limit', 'INT', 'UTF-16']] },
    { id: 's', label: 'snapshot', fields: [['id', 'TEXT', 'PK'], ['allows_replay', 'BOOL', ''], ['catalog_digest', 'TEXT', '']] },
    { id: 'b', label: 'bundle', fields: [['evidence_ids', 'ARRAY', ''], ['exported_at', 'TEXT', ''], ['portable', 'BOOL', '']] }
  ],
  edges: [
    ['p.evidence_id', 'e.id', '', 'many-one'],
    { from: 'o.object_id', to: 'e.location', label: '坐标引用', kind: 'primary' },
    ['b.evidence_ids', 'e.id', '', 'many-one'],
    ['s.id', 'e.source', '回放来源', 'many-one']
  ]
});

// ---------- 10 flowchart ----------
add('10-flowchart', {
  type: 'flowchart', title: '一次调查的决策树', subtitle: 'REA 怎么选路径：目标 → 手段 → 证据',
  caption: '依据 README "What you can analyze" 表与 docs/cli.md 的 provider 选择逻辑归纳。',
  nodes: [
    { id: 's', label: '拿到分析目标', shape: 'terminal', row: 0, col: 1 },
    { id: 'd1', label: '格式是内置静态项？', shape: 'decision', row: 1, col: 1 },
    { id: 'n1', label: '直接 inspect_*', sub: '零依赖：PE/ELF/GPU/IL2CPP…', row: 1, col: 0 },
    { id: 'd2', label: '需要原生伪代码？', shape: 'decision', row: 2, col: 1 },
    { id: 'n2', label: '选 provider', sub: 'Hopper/Ghidra/IDA/Kuna', row: 2, col: 0 },
    { id: 'd3', label: '要看运行时行为？', shape: 'decision', row: 3, col: 1 },
    { id: 'n3', label: '运行时观测', sub: 'browser/adb/frida/process', row: 3, col: 0 },
    { id: 'n4', label: '应用静态分析', sub: 'analyze_javascript_application', focal: true, row: 3, col: 2 },
    { id: 'e', label: '全部结论带 Evidence 返回', shape: 'terminal', row: 4, col: 1 }
  ],
  edges: [
    ['s', 'd1'],
    { from: 'd1', to: 'n1', label: '是', kind: 'primary' },
    { from: 'd1', to: 'd2', label: '否' },
    { from: 'd2', to: 'n2', label: '是', kind: 'primary' },
    { from: 'd2', to: 'd3', label: '否' },
    { from: 'd3', to: 'n3', label: '是', kind: 'primary' },
    { from: 'd3', to: 'n4', label: '否', kind: 'primary' },
    { from: 'n1', to: 'e' },
    { from: 'n4', to: 'e', label: '模块/IPC/边界' }
  ]
});

// ---------- 11 sequence ----------
add('11-sequence', {
  type: 'sequence', title: '一次 MCP 调用的时序', subtitle: '从 tools/list 到带证据的结果',
  caption: '依据 createServer.ts 与 mcp-contracts.md：紧凑 schema 默认开启；结果先过准入与预算，证据按 id 可回读。',
  evidence: [{ id: 'sv', file: 'src/server/createServer.ts', line: 441 }],
  numbered: true,
  participants: [
    { id: 'ag', label: 'AI Agent', kind: 'external' },
    { id: 'srv', label: 'MCP Server' },
    { id: 'adm', label: 'Admission 准入' },
    { id: 'app', label: 'Application 工作流', kind: 'focal' },
    { id: 'prv', label: 'Provider/Adapter' },
    { id: 'ev', label: 'Evidence' }
  ],
  messages: [
    ['ag', 'srv', 'tools/list（compact schema）'],
    ['ag', 'srv', '调用 inspect_/analyze_*'],
    ['srv', 'adm', '准入检查：单活跃 inspection'],
    ['adm', 'app', '预算预留后放行'],
    ['app', 'prv', '读取目标 / 启动桥接'],
    ['prv', 'app', 'inventory + 解码载荷'],
    ['app', 'ev', 'recordEvidence：file:line/坐标'],
    ['app', 'srv', '结构化结果 + 证据 id'],
    ['srv', 'ag', '返回（摘要 + 限制说明）'],
    ['ag', 'ev', 'inspect_analysis_view 取全文']
  ],
  fragments: [{ kind: 'opt', label: '未选载荷保持 not-selected', from: 8, to: 9 }]
});

// ---------- 12 state ----------
add('12-state', {
  type: 'state', title: '载荷检查状态机', subtitle: 'complete / partial / unexamined 是一等公民',
  caption: '依据 docs/gpu-code-objects.md 的覆盖度词汇：未选中≠不存在；冲突目标保留双值并标记 partial。',
  evidence: [{ id: 'gpu', file: 'docs/gpu-code-objects.md', line: 14 }],
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'inv', label: 'inventoried', sub: '清点完成', row: 0, col: 1 },
    { id: 'uns', label: 'not-selected', sub: '在册未选', row: 0, col: 2 },
    { id: 'dec', label: 'decoding', focal: true, sub: '预算内解码', row: 0, col: 3 },
    { id: 'ok', label: 'complete', shape: 'end', sub: '全覆盖', row: 1, col: 3 },
    { id: 'par', label: 'partial', sub: '保留已知+局限', row: 1, col: 2 },
    { id: 'unsup', label: 'unsupported', sub: 'bitcode/旧压缩', row: 1, col: 1 },
    { id: 'bad', label: 'malformed', sub: '损坏仍报告', row: 2, col: 1 }
  ],
  edges: [
    ['s', 'inv', 'inventory'],
    { from: 'inv', to: 'uns', label: '未选中' },
    { from: 'uns', to: 'dec', label: 'object_ids 选择', kind: 'primary' },
    { from: 'dec', to: 'ok', label: '解码完成', kind: 'primary' },
    { from: 'dec', to: 'par', label: '预算/格式限制' },
    { from: 'dec', to: 'unsup', label: '编解码器不支持' },
    { from: 'dec', to: 'bad', label: '解析失败' },
    { from: 'inv', to: 'dec', label: '整目录分析', kind: 'primary' }
  ]
});

// ---------- 13 swimlane ----------
add('13-swimlane', {
  type: 'swimlane', title: '复刻一个功能的全流程（跨职能）', subtitle: '你只负责提问，证据贯穿始终',
  caption: '依据 README 叙事（Understand how search works…）与 docs/cli.md 的 evidence_output 流程。',
  budget: 'faithful',
  lanes: [
    { id: 'you', label: '你' },
    { id: 'ag', label: 'AI Agent' },
    { id: 'rea', label: 'REA' },
    { id: 'prv', label: '引擎/适配器' },
    { id: 'ev', label: '证据层' }
  ],
  nodes: [
    { id: 'q', label: '这功能怎么实现的？', lane: 'you', col: 0 },
    { id: 'plan', label: '规划工具调用', lane: 'ag', col: 1 },
    { id: 'inv', label: 'inventory 清点目标', lane: 'rea', col: 2 },
    { id: 'deep', label: '反编译/解码', lane: 'prv', col: 3, focal: true },
    { id: 'cite', label: '记录 file:line 证据', lane: 'ev', col: 4 },
    { id: 'expl', label: '解释机制+局限', lane: 'ag', col: 5 },
    { id: 'build', label: '写实现+测试对比', lane: 'ag', col: 6 },
    { id: 'ok', label: '验收上线', lane: 'you', col: 7 }
  ],
  edges: [
    ['q', 'plan'], { from: 'plan', to: 'inv', kind: 'primary' },
    { from: 'inv', to: 'deep', kind: 'primary' }, ['deep', 'cite'],
    { from: 'cite', to: 'expl', kind: 'primary' }, ['expl', 'build'], ['build', 'ok']
  ]
});

// ---------- 14 process ----------
add('14-process', {
  type: 'process', title: '五步用起来', subtitle: '从安装到第一次带证据的分析',
  caption: '依据 README Quick start：npx rea-agents setup 负责注册与备份；更新用 rea update。',
  steps: [
    { label: '装好 Node 22+ 后获取 REA', sub: 'npx rea-agents@latest setup 或 npm i -g' },
    { label: '注册你的 Agent', sub: 'setup 写入 MCP 配置+工作流说明并备份' },
    { label: '准备分析目标', sub: '本地目录 / ASAR / APK / 二进制 / 捕获文件' },
    { label: '直接提问', sub: 'Agent 经 MCP 调工具，返回结构化事实' },
    { label: '读证据并复刻', sub: 'export_evidence_bundle 随时可回溯' }
  ]
});

// ---------- 15 data-flow ----------
add('15-data-flow', {
  type: 'data-flow', title: '证据是怎么流动的', subtitle: '一次读取，三重沉淀',
  caption: '依据 mcp-contracts.md 与 gpu-code-objects.md：解码产物可保留为带 SHA-256 的文本工件，历史页永不重读输入文件。',
  budget: 'faithful',
  evidence: [{ id: 'gpu', file: 'docs/gpu-code-objects.md', line: 150 }],
  nodes: [
    { id: 'in', label: '目标输入', sub: '文件/ASAR/捕获', kind: 'input', row: 0, col: 0 },
    { id: 'hash', label: 'SHA-256 锚定', sub: '变更即拒绝', row: 0, col: 1 },
    { id: 'inv', label: 'inventory 清点', sub: 'targets/objects/sections', row: 1, col: 1 },
    { id: 'dec', label: '载荷解码', sub: 'lz4/zstd/zlib', focal: true, row: 1, col: 2 },
    { id: 'ret', label: '保留工件', sub: 'PTX 全文等 ≤16MiB', row: 0, col: 3 },
    { id: 'res', label: '结构化结果', sub: '字段级选择', row: 1, col: 3 },
    { id: 'ev', label: 'Evidence id', sub: '可回读/可导出', row: 2, col: 2 },
    { id: 'ag', label: 'Agent 消费', kind: 'external', row: 2, col: 3 }
  ],
  edges: [
    { from: 'in', to: 'hash', label: '整文件流式哈希', kind: 'primary' },
    ['hash', 'inv'], { from: 'inv', to: 'dec', label: '仅选中载荷', kind: 'primary' },
    ['dec', 'ret'], ['dec', 'res'], ['ret', 'ev'], ['res', 'ev'], ['ev', 'ag', '摘要回传']
  ]
});

// ---------- 16 journey ----------
add('16-journey', {
  type: 'journey', title: '逆向新手的旅程', subtitle: '从"看到好功能"到"我的项目里也有了"',
  caption: '情绪得分为分析性推断；步骤均对应 README 与 docs 的真实入口。',
  stages: [
    { label: '发现', steps: [{ label: '看到别人应用里的好功能', score: 1 }, { label: '想知道底层怎么实现', score: 0 }] },
    { label: '安装', steps: [{ label: 'npx rea-agents setup 一条命令', score: 1 }, { label: '重启 agent 完成 MCP 注册', score: 0 }] },
    { label: '首查', steps: [{ label: '拖入目标路径直接提问', score: 1 }, { label: 'inventory 给出候选与证据', score: 2 }] },
    { label: '深挖', steps: [{ label: '伪代码/汇编逐段读', score: 0 }, { label: '证据链交叉验证结论', score: 1 }] },
    { label: '复刻', steps: [{ label: '让 agent 按证据写实现', score: 1 }, { label: '与原行为对比测试通过', score: 2 }] }
  ]
});

// ---------- 17 timeline ----------
add('17-timeline', {
  type: 'timeline', title: '从 0.2.0 到 6.8.0', subtitle: '39 个 tag 的三个月发布史',
  caption: CAP + '；作者日期受 squash 合流影响高度集中于 10 月，tag 时间更能反映发布节奏。',
  events: [
    { date: '2026-04-14', label: '仓库首次提交' },
    { date: '2026-07-12', label: '首个公开版本 rea-0.2.0' },
    { date: '2026-07-13', label: '两天内冲到 1.0.0' },
    { date: '2026-07-25', label: '2.5.1 · 7 月连发 10+ 版' },
    { date: '2026-10-04', label: '3.2.0 · 格式大扩张' },
    { date: '2026-10-08', label: '5.0.0' },
    { date: '2026-10-25', label: '6.8.0 · GPU/BEAM/IL2CPP/agentenv' }
  ],
  periods: [
    { from: '2026-07', to: '2026-07', label: '开源首发冲刺（0.x→2.5）' },
    { from: '2026-08', to: '2026-09', label: '静默积累（git 可见仅 121 提交）' },
    { from: '2026-10', to: '2026-10', label: '爆发：5459 提交 + 8 个大版本' }
  ]
});

// ---------- 18 gantt ----------
add('18-gantt', {
  type: 'gantt', title: '版本演进甘特图', subtitle: '按 tag 时间划分四个阶段',
  caption: CAP + '；阶段边界取自 git tag 的 creatordate。',
  today: '2026-11-01',
  tasks: [
    { id: 'a', label: '0.x → 1.0 首发冲刺', section: '2026-07 首发', start: '2026-07-12', end: '2026-07-14', done: true },
    { id: 'b', label: '2.x 快速迭代', section: '2026-07 首发', start: '2026-07-14', end: '2026-07-25', done: true },
    { id: 'c', label: '平台期：内功积累', section: '2026-08→09', start: '2026-08-01', end: '2026-09-30', done: true },
    { id: 'd', label: '3.x：格式大扩张', section: '2026-10 爆发', start: '2026-10-01', end: '2026-10-07', done: true },
    { id: 'e', label: '5.x–6.x：证据与规模化', section: '2026-10 爆发', start: '2026-10-08', end: '2026-10-31', done: true }
  ],
  milestones: [
    { label: '1.0.0', date: '2026-07-13' },
    { label: '6.8.0', date: '2026-10-25' }
  ]
});

// ---------- 19 kanban ----------
add('19-kanban', {
  type: 'kanban', title: '工具家族看板', subtitle: '18 个家族按分析域归并成五列',
  caption: '列=分析域（家族归并），卡片=真实工具名（src/contracts/*ToolContracts.ts 抽样）。',
  columns: [
    { label: '内置速查', cards: [{ label: 'inspect_pe_imports', tag: '零依赖' }, { label: 'inspect_gpu_code_objects', tag: '零依赖' }, { label: 'inspect_go_binary / inspect_rust_binary', tag: '零依赖' }, { label: 'inspect_model_artifact', tag: '模型文件' }] },
    { label: '原生反编译', cards: [{ label: 'analyze_function', tag: '摘要/完整' }, { label: 'decompile / read_bytes', tag: 'provider' }, { label: 'list_procedures / list_strings', tag: 'provider' }, { label: 'inspect_with_objdump', tag: '调用方工具' }] },
    { label: '应用与运行时', cards: [{ label: 'analyze_javascript_application', tag: 'ASAR' }, { label: 'inspect_electron_fuses', tag: 'Electron' }, { label: 'analyze_web_bundle', tag: '网站' }, { label: 'inspect_web_page', tag: '观测' }] },
    { label: '移动与设备', cards: [{ label: 'inspect_android_method', tag: 'JADX' }, { label: 'inspect_apk_signature', tag: 'v1–v3.1' }, { label: 'inspect_adb_device', tag: '设备' }, { label: 'list_frida_processes', tag: '插桩' }] },
    { label: '证据与导出', cards: [{ label: 'inspect_analysis_view', tag: '分页' }, { label: 'export_evidence_bundle', tag: '携带' }, { label: 'export_environment_bundle', tag: 'RL' }, { label: 'read_guidance_section', tag: '向导' }] }
  ]
});

// ---------- 20 story-map ----------
add('20-story-map', {
  type: 'story-map', title: '产品故事图', subtitle: '主干活动 × 发布切片',
  caption: '切片为分析性归纳：已发布=v6.8.0 可验证能力，演进中=CHANGELOG/文档中仍在扩张的方向。',
  releases: ['已发布 v6.8.0', '演进中'],
  activities: [
    { label: '看懂', focal: true, steps: [{ label: '静态格式', stories: { '已发布 v6.8.0': ['36 类目标 · 多数零依赖'], '演进中': ['更多压缩/表格式'] } }, { label: '反编译', stories: { '已发布 v6.8.0': ['Hopper/Ghidra/IDA/Kuna/JEB/Cutter'], '演进中': ['Windows Ghidra 转正'] } }] },
    { label: '带证据', steps: [{ label: '证据链', stories: { '已发布 v6.8.0': ['file:line/坐标 + SHA-256'] } }, { label: '摘要', stories: { '已发布 v6.8.0': ['retained summaries + view 取页'], '演进中': ['更多可恢复上限配置'] } }] },
    { label: '复刻', steps: [{ label: '实现', stories: { '已发布 v6.8.0': ['agent 按证据写实现'] } }, { label: '验证', stories: { '已发布 v6.8.0': ['run comparisons / conformance'] } }] },
    { label: '规模化', steps: [{ label: 'RL 环境', stories: { '已发布 v6.8.0': ['agentenv 构建与回放'] } }, { label: '批处理', stories: { '已发布 v6.8.0': ['JSONL 行输出'], '演进中': ['更多导出目标'] } }] }
  ]
});

// ---------- 21 loop ----------
add('21-loop', {
  type: 'loop', title: '证据驱动的调查飞轮', subtitle: '每一圈都把问题缩小一点',
  caption: '机制依据 README「How REA works」：返回的证据用于追问，直到能解释或复刻。',
  center: '证据闭环',
  centerSub: 'ask → inspect → cite',
  steps: [
    { label: '提出问题', sub: '这个功能怎么实现' },
    { label: '检查目标', sub: 'inspect/analyze 工具' },
    { label: '沉淀证据', sub: 'file:line + 字节坐标' },
    { label: '追问缩小范围', sub: 'follow-up 调用' },
    { label: '解释并复刻', sub: '实现 + 对比测试' }
  ]
});

// ---------- 22 medallion ----------
add('22-medallion', {
  type: 'medallion', title: '目标字节的分层加工', subtitle: '原始文件 → 清点结构 → 证据事实',
  caption: '层名为数据平台类比；物品均取自仓库真实组件（inventory/object/view/evidence）。',
  stages: [
    { label: '原始层', plain: true, kind: 'input', items: ['目标二进制/ASAR 原始字节', 'HAR/SAZ/pcap 捕获', '设备 dump 与日志'] },
    { label: '结构层', items: ['inventory：targets/objects', '节区/段/符号表清点', 'SHA-256 与位置索引'] },
    { label: '应用层', items: ['内核字段/伪代码页', 'retained 摘要与全文', 'Evidence 引用与 bundle'] }
  ]
});

// ---------- 23 dp-integration ----------
add('23-dp-integration', {
  type: 'dp-integration', title: '多源目标接入', subtitle: '五种来源域汇入同一证据平台',
  caption: '依据 README 目标表与 docs 各 guide：来源经 adapters/桥接进入 domain 规则，产出统一 Evidence。',
  stages: [
    { label: '来源', plain: true, kind: 'external', items: [{ id: 'fs', label: '本地文件/ASAR' }, { id: 'dev', label: 'Android 设备 (adb)' }, { id: 'br', label: '浏览器 (Chrome 族)' }, { id: 'cap', label: '网络捕获 HAR/pcap' }, { id: 'eng', label: '引擎进程 (Hopper…)' }] },
    { label: '接入', items: [{ id: 'ad', label: 'target adapters' }, { id: 'bd', label: 'provider bridges' }] },
    { label: '平台', items: [{ id: 'dom', label: 'domain 规则' }, { id: 'adm', label: 'admission 预算' }] },
    { label: '消费', items: [{ id: 'mcp', label: 'MCP 结构化结果' }, { id: 'ev', label: 'Evidence 工件' }, { id: 'jl', label: 'JSONL 行导出' }] }
  ],
  edges: [['fs', 'ad'], ['dev', 'ad'], ['br', 'ad'], ['cap', 'ad'], ['eng', 'bd'], ['ad', 'dom'], { from: 'bd', to: 'dom', kind: 'primary' }, ['dom', 'adm'], ['adm', 'mcp'], ['adm', 'ev'], { from: 'ev', to: 'jl', kind: 'primary' }]
});

// ---------- 24 dp-security-matrix ----------
add('24-dp-security-matrix', {
  type: 'dp-security-matrix', title: '副作用矩阵：每类分析碰什么', subtitle: '效果声明驱动的安全边界',
  caption: '等级 none<read<write；依据 docs/mcp-contracts.md 的 effect metadata（launchesProcess/writesFilesystem 等）：分析不执行目标应用代码。',
  rows: ['内置静态格式', '原生反编译桥', 'JS/Electron 静态', '浏览器观测', 'ADB 设备', 'Frida 插桩'],
  cols: ['读目标文件', '启动自有进程', '写文件系统', '访问网络', '执行目标代码'],
  cells: [
    ['read', 'none', 'none', 'none', 'none'],
    ['read', 'write', 'write', 'none', 'none'],
    ['read', 'write', 'write', 'none', 'none'],
    ['read', 'write', 'write', 'write', 'none'],
    ['read', 'write', 'write', 'write', 'none'],
    ['read', 'write', 'write', 'none', 'write']
  ],
  focal: '内置静态格式'
});

// ---------- 25 tree ----------
add('25-tree', {
  type: 'tree', title: '仓库目录结构', subtitle: '6900+ 跟踪文件的分布',
  caption: CAP + '；括号内为文件数（find 统计 ts/tsx/mjs/py/swift/java）。',
  budget: 'faithful',
  root: {
    label: 'rea/', children: [
      { label: 'src/ (~6100)', sub: '分析本体', children: [
        { label: 'domain/ (1190)', sub: '30.1 万行纯核心' },
        { label: 'application/ (567)', sub: '工作流编排' },
        { label: 'providers/', sub: 'ghidra 97 · native 153 · ida 38…' },
        { label: 'server+cli (225)', sub: 'MCP 与终端入口' }
      ] },
      { label: 'tests/ (2158)', sub: '58.4 万行 · 比多数项目整个仓库还大' },
      { label: 'scripts/ (418)', sub: '构建/验证/真实环境脚本' },
      { label: 'docs/ (98)', sub: '每个目标类型一篇 guide' },
      { label: 'bridge/ (36)', sub: 'Hopper/Ghidra/Cutter/pwndbg Python 桥' },
      { label: 'website/', sub: 'rea.tools 官网' }
    ]
  }
});

// ---------- 26 org-chart ----------
add('26-org-chart', {
  type: 'org-chart', title: '把 REA 当一家「逆向事务所」', subtitle: '组织架构即依赖结构',
  caption: '人员无关；角色划分依据 createServer 的装配关系与 provider 注册表。',
  budget: 'faithful',
  root: {
    label: '你（委托人）', sub: '提出问题、验收复刻', children: [
      { label: '项目经理', sub: 'Application 工作流', children: [
        { label: '规则库', sub: 'Domain · 30.1 万行' },
        { label: '外聘专家团', sub: 'Hopper/Ghidra/IDA/Kuna', children: [
          { label: '翻译官', sub: 'Python bridge 脚本' }
        ] },
        { label: '现场调查员', sub: 'Browser/ADB/Frida 观测' }
      ] },
      { label: '档案管理员', sub: 'Evidence：编号、坐标、哈希' },
      { label: '前台', sub: 'MCP Server + CLI 双窗口' }
    ]
  }
});

// ---------- 27 nested ----------
add('27-nested', {
  type: 'nested', title: '分析边界嵌套', subtitle: '一次工具调用要穿过的边界',
  caption: '边界为分析性描绘：依据 mcp-contracts.md 的 effect 声明、gpu-code-objects.md 的预算与准入语义。',
  budget: 'faithful',
  root: {
    label: '你的机器', children: [
      { label: 'REA 进程', sub: 'Node 22+ · 单活跃 inspection', children: [
        { label: 'admission 准入', sub: '512MiB 载荷 / 16MiB 保留', children: [
          { label: 'provider 桥', sub: 'owned 子进程 · hopper_bridge.py', children: [
            { label: '目标文件/设备', sub: 'SHA-256 锚定 · 只读', children: [
              { label: 'Evidence', sub: '坐标与哈希回传，永不重读输入' }
            ] }
          ] }
        ] }
      ] }
    ]
  }
});

// ---------- 28 layers ----------
add('28-layers', {
  type: 'layers', title: '证据可信度七层', subtitle: '从原始字节到可携带结论',
  caption: '全部为仓库真实机制：SHA-256 锚定、codec 长度校验、target 一致性比对、retained 文本、bundle 导出。',
  layers: [
    { label: '字节层', sub: '输入即真相', items: ['整文件 SHA-256 流式哈希', '选中载荷须 expected_sha256'] },
    { label: '解码层', sub: '有界解压', items: ['声明长度先于解码校验', '截断 MD5 核对（CCOB）'] },
    { label: '归一层', sub: '双源比对', items: ['target vs payload_target', '冲突保留双值 + partial'] },
    { label: '事实层', sub: '字段级选择', items: ['inventory/对象/内核分页'] },
    { label: '引用层', sub: '可回溯', items: ['file:line / 容器坐标', '解码偏移≠物理偏移'] },
    { label: '证据层', sub: '一等公民', items: ['Evidence id + 全文工件'] },
    { label: '交付层', sub: '可携带', items: ['export_evidence_bundle', 'JSONL 分帧输出'] }
  ]
});

// ---------- 29 isometric ----------
add('29-isometric', {
  type: 'isometric', title: '一台逆向工作站', subtitle: '把部署形态画成实物',
  caption: '示意：显示器=Agent+MCP 客户端，主机=REA 服务层，侧挂外接盒=反编译引擎桥，文件柜=Evidence 工件。',
  parts: [
    { label: '桌面板', x: 0, y: 40, z: 0, w: 320, d: 200, h: 10, r: 4 },
    { label: '显示器（Agent）', x: 40, y: 0, z: 10, w: 180, d: 10, h: 110, r: 3, kind: 'screen' },
    { label: '显示器支架', x: 120, y: 20, z: 10, w: 14, d: 10, h: 40 },
    { label: '主机（REA 服务层）', x: 60, y: 70, z: 10, w: 120, d: 70, h: 46, r: 4 },
    { label: 'Evidence 文件柜', sub: 'SHA-256 归档', x: 200, y: 120, z: 10, w: 60, d: 44, h: 26, kind: 'vault' },
    { label: '引擎外接盒', sub: 'Hopper/Ghidra 桥', x: 250, y: 60, z: 10, w: 60, d: 44, h: 30, kind: 'terminal' },
    { label: '键盘（rea CLI）', x: 60, y: 160, z: 10, w: 110, d: 30, h: 6, r: 2 }
  ]
});

// ---------- 30 exploded ----------
add('30-exploded', {
  type: 'exploded', title: '拆开 rea-agents npm 包', subtitle: '42 个运行时依赖装进去什么',
  caption: '示意拆解：内容依据 package.json（bin: rea/rea-agents）、bridge/ 与 native/ 目录、setup 写入物。',
  parts: [
    { label: 'npm 包外壳', sub: 'rea-agents · 42 deps', kind: 'housing', w: 190, d: 340, t: 16, r: 20 },
    { label: 'bin 双入口', sub: 'rea + rea-agents', w: 150, d: 60, t: 12 },
    { label: 'domain+application', sub: '45.9 万行分析内核', w: 150, d: 60, t: 12 },
    { label: 'contracts', sub: '约 240 操作的 schema', w: 150, d: 60, t: 12 },
    { label: 'bridge 脚本', sub: 'hopper/ghidra/cutter/pwndbg Python', w: 150, d: 60, t: 10, kind: 'plate' },
    { label: 'setup 工作流说明', sub: '写入 agent 的技能文件', w: 150, d: 60, t: 10, kind: 'chip' }
  ]
});

// ---------- 31 isometric-plan ----------
add('31-isometric-plan', {
  type: 'isometric-plan', title: '代码平面图', subtitle: '如果 src 是一个园区',
  caption: '面积为行数的示意比例；房间名=模块（行数来自 find+cat 统计）。',
  plate: { w: 960, d: 480 },
  rooms: [
    { label: 'domain 车间', sub: '30.1 万行 · 1190 文件', x: 20, y: 20, w: 320, d: 250, walls: true, door: 'S' },
    { label: 'application 层', sub: '15.8 万行 · 567 文件', x: 360, y: 20, w: 240, d: 200, walls: true, door: 'S' },
    { label: '观测巷', sub: '观测三模块 · 16.6 万行', x: 620, y: 20, w: 310, d: 180, walls: true, door: 'S' },
    { label: '引擎巷', sub: '六个引擎模块 · 14.3 万行', x: 360, y: 240, w: 260, d: 150, walls: true, door: 'N' },
    { label: 'server/cli 门房', sub: '3.5 万行', x: 640, y: 220, w: 140, d: 120, walls: true, door: 'N' },
    { label: 'composition 配电房', sub: '1163 行 DI 根', x: 800, y: 220, w: 120, d: 120, walls: true, door: 'W' }
  ],
  boxes: [
    { x: 60, y: 300, w: 70, d: 40, h: 14, kind: 'desk', label: '工作流' },
    { x: 160, y: 300, w: 70, d: 40, h: 14, kind: 'desk', label: '准入' },
    { x: 260, y: 300, w: 50, d: 40, h: 14, kind: 'rack', label: '证据' }
  ]
});

// ---------- 32 venn ----------
add('32-venn', {
  type: 'venn', title: '三种入口的重叠', subtitle: 'MCP、CLI 与 RL 环境共享同一个服务层',
  caption: '划分依据 README（CLI commands use the same workflows）与 6.8.0 的 agentenv 能力。',
  sets: [
    { id: 'mcp', label: 'MCP', sub: '注册给 Agent' },
    { id: 'cli', label: 'CLI', sub: 'rea 命令 · --json' },
    { id: 'rl', label: 'agentenv', sub: 'RL 环境回放' }
  ],
  overlaps: [
    { sets: ['mcp', 'cli'], label: '同一 Application 工作流' },
    { sets: ['mcp', 'rl'], label: '工具即动作空间' },
    { sets: ['cli', 'rl'], label: '快照与批处理' },
    { sets: ['mcp', 'cli', 'rl'], label: '统一 Evidence 契约' }
  ]
});

// ---------- 33 pyramid ----------
add('33-pyramid', {
  type: 'pyramid', title: '36 类目标的依赖金字塔', subtitle: '越往上越省事，越往下越深刻',
  caption: '数量按 README「What you can analyze」36 行归并统计；塔尖少而深，塔底大而稳。',
  unit: '类',
  levels: [
    { label: '运行时观测', value: 4, sub: 'browser · adb · frida · process', focal: true },
    { label: '反编译引擎', value: 6, sub: 'Hopper/Ghidra/IDA/Kuna/JEB/Cutter' },
    { label: '调用方工具', value: 9, sub: 'JADX · WABT · pwntools · tshark · binwalk…' },
    { label: '内置零依赖', value: 17, sub: 'PE/ELF/GPU/IL2CPP/Go/Rust/BEAM…' }
  ]
});

// ---------- 34 quadrant ----------
add('34-quadrant', {
  type: 'quadrant', title: '目标类型矩阵：结果深度 × 环境依赖', subtitle: '选目标前先看这张图',
  caption: '位置为分析性判断，依据 README 目标表的 Requirements 列（None=零依赖）。',
  x: { label: '结果深度', low: '清单级', high: '伪代码级' },
  y: { label: '环境依赖', low: '零依赖', high: '重依赖' },
  quadrants: ['装工具·速查', '重装上阵·深读', '开箱速查', '开箱深读'],
  items: [
    { label: 'JS/Electron', x: 0.9, y: 0.15, focal: true },
    { label: '.NET 程序集', x: 0.82, y: 0.12 },
    { label: 'GPU 代码对象', x: 0.62, y: 0.1 },
    { label: 'IL2CPP/Go/Rust', x: 0.55, y: 0.08 },
    { label: 'WASM', x: 0.55, y: 0.45 },
    { label: '原生反编译', x: 0.95, y: 0.75 },
    { label: 'Android APK', x: 0.8, y: 0.62 },
    { label: '网站/浏览器', x: 0.72, y: 0.85 },
    { label: 'pcap/固件', x: 0.5, y: 0.8 }
  ]
});

// ---------- 35 fishbone ----------
add('35-fishbone', {
  type: 'fishbone', title: '根因分析：分析为什么会受限', subtitle: 'REA 如实报告失败面的四类来源',
  caption: '原因为仓库可见事实的归纳：启动超时环境变量、procps 前置、编解码器白名单与三层预算均写明在 docs。',
  effect: '分析受限 / 显式失败',
  categories: [
    { label: '引擎', focal: true, causes: ['provider 未安装', '启动超时 REA_*_STARTUP_TIMEOUT_MS', '格式/宿主不支持'] },
    { label: '环境', causes: ['Linux 缺 procps ps', '缺 JDK（JADX）', '非 x64 宿主'] },
    { label: '格式', causes: ['LLVM bitcode unsupported', '旧版 YAML 元数据', '压缩 codec 不识别'] },
    { label: '预算', causes: ['512MiB 载荷工作量', '16MiB 保留事实', '单活跃 inspection'] }
  ]
});

// ---------- 36 wardley ----------
add('36-wardley', {
  type: 'wardley', title: 'Wardley 演进图', subtitle: 'Agent 逆向生态的战略坐标',
  caption: '位置为分析性判断；evo 左=创世 右=商品化，vis 上=用户可见 下=基础设施。',
  components: [
    { id: 'need', label: '看懂功能并复刻', evo: 0.5, vis: 0.95, anchor: true },
    { id: 'agent', label: 'Agent 编码助手', evo: 0.8, vis: 0.85 },
    { id: 'mcpstd', label: 'MCP 协议', evo: 0.75, vis: 0.6 },
    { id: 'rea', label: 'REA 工具面', evo: 0.55, vis: 0.7, focal: true },
    { id: 'ev', label: 'Evidence 契约', evo: 0.45, vis: 0.5 },
    { id: 'eng', label: '反编译引擎', evo: 0.3, vis: 0.35 },
    { id: 'rt', label: '运行时观测', evo: 0.4, vis: 0.3 },
    { id: 'tgt', label: '目标二进制', evo: 0.15, vis: 0.15 }
  ],
  links: [['need', 'agent'], ['agent', 'mcpstd'], ['mcpstd', 'rea'], ['rea', 'ev'], ['rea', 'eng'], ['rea', 'rt'], ['eng', 'tgt'], ['rt', 'tgt']]
});

// ---------- 37 bar ----------
add('37-bar', {
  type: 'bar', orientation: 'horizontal', title: '各模块代码量', subtitle: 'find+cat 全量统计（ts/tsx/mjs/py/swift/java）',
  caption: CAP + '；tests 比 domain 大近一倍——测试是这个仓库最厚的层。',
  unit: '千行',
  sort: 'desc',
  focal: 'tests',
  axis: '代码行数（千行）',
  data: [['tests', 583.7], ['src/domain', 301.1], ['src/application', 158.3], ['scripts', 87.9], ['src/browser', 63.0], ['src/artifacts', 59.9], ['src/native', 53.3], ['src/process', 42.6]]
});

// ---------- 38 line ----------
add('38-line', {
  type: 'line', title: '每月提交数', subtitle: '2026-04 至 2026-10（git log 按作者日期）',
  caption: CAP + '；squash 合流与历史导入使提交高度集中于 10 月（5459），tag 节奏（39 个）更接近真实开发节奏。',
  unit: '提交',
  smooth: false,
  area: true,
  zero: false,
  x: ['04', '05', '06', '07', '08', '09', '10'],
  series: [{ name: '提交数', values: [1, 0, 0, 697, 21, 100, 5459], focal: true }]
});

// ---------- 39 scatter ----------
add('39-scatter', {
  type: 'scatter', title: '各目录：文件数 × 代码量', subtitle: '一个点一个顶层模块',
  caption: CAP + '；domain 用 1190 个文件承载 30 万行核心，tests 用 2158 个文件写满 58 万行。',
  xLabel: '文件数',
  yLabel: '代码行数（千行）',
  zero: false,
  points: [
    { label: 'tests', x: 2158, y: 583.7 },
    { label: 'domain', x: 1190, y: 301.1, focal: true },
    { label: 'application', x: 567, y: 158.3 },
    { label: 'scripts', x: 418, y: 87.9 },
    { label: 'browser', x: 194, y: 63.0 },
    { label: 'artifacts', x: 188, y: 59.9 },
    { label: 'native', x: 153, y: 53.3 },
    { label: 'server', x: 142, y: 20.5 },
    { label: 'process', x: 139, y: 42.6 },
    { label: 'ghidra', x: 97, y: 34.5 },
    { label: 'cli', x: 83, y: 14.2 }
  ]
});

// ---------- 40 waterfall ----------
add('40-waterfall', {
  type: 'waterfall', title: '162 万行是怎么堆出来的', subtitle: '按模块群累加到全仓总量',
  caption: CAP + '；"其余 src 模块"含 server/cli/contracts 与 30 余个 provider/adapter 目录。',
  unit: '千行',
  steps: [['src/domain', 301.1], ['src/application', 158.3], ['其余 src 模块', 476.6], ['tests', 583.7], ['scripts+bridge', 102.1]]
});

// ---------- 41 treemap ----------
add('41-treemap', {
  type: 'treemap', title: 'src 模块的文件数构成', subtitle: 'SC scan 目录级统计（21 个主要模块）',
  caption: CAP + '；核心域两模块即占 src 文件数的近三成。',
  unit: '文件',
  focal: 'domain',
  data: [
    { label: '核心域', children: [['domain', 1190], ['application', 567]] },
    { label: '观测面', children: [['browser', 194], ['artifacts', 188], ['process', 139]] },
    { label: '引擎面', children: [['native', 153], ['ghidra', 97], ['dotnet', 56], ['hopper', 40], ['ida', 38], ['javascript', 33], ['kuna', 27]] },
    { label: '支撑面', children: [['server', 142], ['contracts', 119], ['cli', 83], ['composition', 41], ['config', 40]] },
    { label: '外设面', children: [['android', 23], ['adb', 21], ['gpu', 20], ['wasm', 19]] }
  ]
});

// ---------- 42 heatmap ----------
add('42-heatmap', {
  type: 'heatmap', title: '提交热力图：星期 × 时段', subtitle: '6278 次提交的作息（3 小时一档）',
  caption: CAP + '；周六 0-3 点一档 406 次是全图峰值——深夜周末是主旋律。',
  rows: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  cols: ['00-02', '03-05', '06-08', '09-11', '12-14', '15-17', '18-20', '21-23'],
  values: [
    [72, 74, 53, 39, 104, 112, 57, 98],
    [132, 149, 150, 149, 200, 105, 150, 216],
    [83, 79, 98, 74, 128, 135, 99, 101],
    [122, 154, 139, 81, 56, 50, 84, 78],
    [170, 148, 99, 50, 102, 85, 135, 147],
    [406, 316, 165, 99, 95, 88, 72, 74],
    [100, 114, 109, 107, 38, 42, 49, 47]
  ]
});

// ---------- 43 radar ----------
add('43-radar', {
  type: 'radar', title: '工程化画像', subtitle: '对照同体量开源项目的六维评估（1–5，分析性）',
  caption: '评分为依据仓库证据（33 个 CI workflow、58 万行测试、98 篇文档、39 个 tag 的发布自动化、23 语言 README）的相对判断。',
  axes: ['测试密度', 'CI 深度', '文档厚度', '发布工程', '跨平台', '格式覆盖'],
  max: 5,
  series: [
    { name: 'REA', values: [5, 5, 5, 5, 4, 5], focal: true },
    { name: '同体量项目典型值', values: [2, 3, 2, 2, 2, 1] }
  ]
});

// ---------- 44 polar ----------
add('44-polar', {
  type: 'polar', title: '提交时刻的钟', subtitle: '24 小时分布（提交者本地时区）',
  caption: CAP + '；凌晨 0-5 点贡献 2119 次（34%）——典型的全球分布式 + 夜猫子协作。',
  center: '6278 提交',
  focal: ['02', '03', '00'],
  data: [
    ['00', 298], ['01', 319], ['02', 468], ['03', 383], ['04', 343], ['05', 308],
    ['06', 223], ['07', 303], ['08', 287], ['09', 241], ['10', 172], ['11', 186],
    ['12', 203], ['13', 267], ['14', 253], ['15', 190], ['16', 197], ['17', 230],
    ['18', 233], ['19', 227], ['20', 186], ['21', 273], ['22', 235], ['23', 253]
  ]
});

// ---------- 45 sankey ----------
add('45-sankey', {
  type: 'sankey', title: '模块依赖流向', subtitle: '谁 import 谁：一切汇入 domain',
  caption: 'SC scan 目录级 import 引用次数（取 top 连边）；application→domain 2269 次是最大单边。',
  unit: 'import 引用',
  links: [
    ['application', 'domain', 2269],
    ['browser', 'domain', 585],
    ['native', 'domain', 374],
    ['artifacts', 'domain', 348],
    ['ghidra', 'domain', 288],
    ['cli', 'domain', 249],
    ['server', 'application', 335],
    ['cli', 'application', 94],
    ['application', 'artifacts', 124],
    ['native', 'artifacts', 118],
    ['server', 'contracts', 112],
    ['artifacts', 'filesystem', 107],
    ['application', 'contracts', 72],
    ['application', 'process', 59]
  ]
});

// ---------- 46 high-level-vertical ----------
add('46-high-level-vertical', {
  type: 'high-level-vertical', title: 'REA 是什么（纵向）', subtitle: '窄幅布局，自上而下',
  caption: CAP,
  nodes: [
    { id: 'you', label: '你', sub: '看到好功能', kind: 'external', row: 0, col: 1 },
    { id: 'rea', label: 'REA', sub: 'MCP + CLI 双入口', focal: true, row: 1, col: 1 },
    { id: 'static', label: '静态格式检查', sub: '36 类目标', row: 2, col: 0 },
    { id: 'runtime', label: '运行时观测', sub: 'browser/adb/frida', row: 2, col: 1 },
    { id: 'ev', label: '证据链', sub: 'file:line + SHA-256', row: 2, col: 2 },
    { id: 'out', label: '解释与复刻', sub: '在你的项目里', row: 3, col: 1 }
  ],
  edges: [
    ['you', 'rea', '提问'],
    { from: 'rea', to: 'static', kind: 'primary' },
    { from: 'rea', to: 'runtime', kind: 'primary' },
    ['static', 'ev'], ['runtime', 'ev'],
    { from: 'ev', to: 'out', label: '带证据实现', kind: 'primary' }
  ]
});

// ---------- 47 sequence-setup ----------
add('47-sequence-setup', {
  type: 'sequence-oauth', title: 'npx rea-agents setup 时序', subtitle: '注册 MCP 的安全路径',
  caption: '依据 README 与 installation 文档：setup 会先备份已有配置；更新走 rea update 的校验流程。',
  evidence: [{ id: 'qs', file: 'README.md', line: 81 }],
  participants: [
    { id: 'you', label: '你', kind: 'external' },
    { id: 'setup', label: 'setup CLI', kind: 'focal' },
    { id: 'cfg', label: '已有 Agent 配置' },
    { id: 'agent', label: 'Claude Code 等' }
  ],
  messages: [
    ['you', 'setup', 'npx rea-agents setup'],
    ['setup', 'you', '列出支持的 Agent 候选'],
    ['you', 'setup', '选择要注册的 Agent'],
    ['setup', 'cfg', '读取现有 MCP 配置'],
    ['setup', 'cfg', '写入备份（可恢复）'],
    ['setup', 'agent', '注册 MCP server + 工作流说明'],
    ['setup', 'you', '提示重启 Agent 生效']
  ],
  fragments: [{ kind: 'opt', label: '已有配置 → 先备份再改', from: 3, to: 5 }]
});

// ---------- 48 state-lifecycle ----------
add('48-state-lifecycle', {
  type: 'state-lifecycle', title: 'Provider 会话生命周期', subtitle: '外置引擎的启停与预算',
  caption: '依据 mcp-contracts.md 与 docs/cli.md：provider 可为已有安装，桥接进程按需启动；预算超限显式拒绝而非静默截断。',
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'abs', label: '未安装', sub: 'setup 可代装 Hopper', row: 0, col: 1 },
    { id: 'ready', label: 'ready', sub: '检测到安装', focal: true, row: 0, col: 2 },
    { id: 'busy', label: 'busy', sub: '单活跃 inspection', row: 0, col: 3 },
    { id: 'ref', label: 'refused', sub: '预算超限显式拒绝', row: 1, col: 3 },
    { id: 'stop', label: 'stopped', sub: '进程退出/超时', row: 1, col: 1 },
    { id: 'e', shape: 'end', sub: '结果 + 证据', row: 1, col: 2 }
  ],
  edges: [
    ['s', 'abs', '首次使用'],
    ['abs', 'ready', '安装/检测到'],
    { from: 'ready', to: 'busy', label: '受理调用', kind: 'primary' },
    { from: 'busy', to: 'e', label: '返回证据', kind: 'primary' },
    ['busy', 'ready', '释放并发位'],
    ['busy', 'ref', '超预算'],
    ['ready', 'stop', '启动超时'],
    ['stop', 'ready', '重试（可调 REA_*_TIMEOUT）']
  ]
});

// ---------- 49 funnel ----------
add('49-funnel', {
  type: 'funnel', title: '单次 inspection 预算漏斗', subtitle: '层层收紧的资源上限（MiB）',
  caption: '数值为 docs/gpu-code-objects.md 声明的真实预算：超限显式拒绝，先预留后读取，绝不静默截断。',
  levels: [
    { label: '载荷工作量预算', value: 512 },
    { label: '单输入/输出缓冲', value: 128 },
    { label: '保留事实（含 PTX）', value: 16 },
    { label: '单页响应', value: 1, sub: '分页取读' }
  ]
});

// ---------- main ----------
mkdirSync('docs', { recursive: true });
let ok = 0, fail = [];
for (const { file, spec } of specs) {
  writeFileSync(`docs/${file}.json`, JSON.stringify(spec, null, 1));
  try {
    const out = execSync(`${SC} render docs/${file}.json`, { encoding: 'utf8' });
    const j = JSON.parse(out);
    if (j.ok) {
      ok++;
      try {
        execSync(`${SC} export docs/${file}.html --formats png`, { encoding: 'utf8' });
        console.log('✓', file, j.warnings?.length ? 'W: ' + j.warnings.map(w => w.code).join(',') : '');
      } catch (e2) { console.log('✓ render / ✗ png', file, String(e2.stdout || e2.message).slice(0, 200)); }
    } else { fail.push(file); console.log('✗', file, JSON.stringify(j).slice(0, 400)); }
  } catch (e) {
    fail.push(file); console.log('✗ ERR', file, String(e.stdout || e.message).slice(0, 400));
  }
}
console.log(`\n${ok}/${specs.length} ok${fail.length ? '；失败：' + fail.join(', ') : ''}`);
