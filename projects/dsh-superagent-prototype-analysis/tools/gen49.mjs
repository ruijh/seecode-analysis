#!/usr/bin/env node
// dsh-superagent · 45 种核心图表 + 4 种变体（共 49 张）批量生成器
// 事实依据：2026-11-01 本地克隆；docs/000-008 九篇编号文档 + 四路代码深读（file:line 见各 spec.evidence）
// 注意：上游为单次 squash 发布（唯一提交 2026-10-31），无 git 历史可统计，数据图表全部改用 LOC/文档/提示词等实测数据。
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SC = 'node "C:/Users/ruijh/.agents/skills/seecode/scripts/seecode.mjs"';
const EYEBROW = 'dsh-superagent · 全方位分析';
const LANG = 'zh-CN';
const CAP = '数据来源：github.com/deepseek-ai/dsh-superagent-prototype（2026-11-01 本地克隆 + 代码深读）';

const specs = [];
const add = (file, spec) => specs.push({ file, spec });

// ---------- 01 architecture ----------
add('01-architecture', {
  type: 'architecture', title: '总体架构：一个仓库的超级代理', subtitle: 'GitHub/飞书 → Engine 五部件 → 双会话执行 → 回复原对话',
  caption: 'docs/007：src/core 零外部依赖，五个 EnginePart 经端口与适配器相连；Passes 每 2s 泵一次 Effects 持久队列。',
  budget: 'faithful',
  evidence: [{ id: 'arch', file: 'docs/007-architecture.md', line: 9 }, { id: 'pump', file: 'src/app/passes.ts', line: 28 }],
  nodes: [
    { id: 'user', label: '团队成员', kind: 'external', row: 1, col: 0 },
    { id: 'gh', label: 'GitHub Source', sub: 'gh cli 轮询', row: 0, col: 1 },
    { id: 'fs', label: '飞书 Source', sub: 'lark-cli 事件', row: 2, col: 1 },
    { id: 'engine', label: 'Engine', sub: '5 个 EnginePart', focal: true, row: 1, col: 2 },
    { id: 'store', label: 'SQLite', sub: 'JSON 文档 + Effects', kind: 'store', row: 1, col: 3 },
    { id: 'orch', label: '主会话', sub: '评估·路由·回复', row: 0, col: 3 },
    { id: 'worker', label: 'Worker 会话', sub: '每 Ticket 一个', row: 2, col: 3 },
    { id: 'out', label: 'Outbox', sub: '幂等回复', row: 1, col: 4 },
    { id: 'panel', label: 'Web 面板', sub: 'HTTP 轮询 5s', row: 0, col: 2 }
  ],
  edges: [
    { from: 'gh', to: 'engine', label: 'Trigger', kind: 'primary' },
    { from: 'fs', to: 'engine', label: 'Trigger', kind: 'primary' },
    ['engine', 'store', '原子事务'],
    { from: 'engine', to: 'orch', label: '评估卡片' },
    ['orch', 'engine', 'Decision'],
    { from: 'engine', to: 'worker', label: 'Assignment', kind: 'primary' },
    ['worker', 'engine', 'Report'],
    { from: 'engine', to: 'out', label: 'Replies' },
    { from: 'out', to: 'user', label: '回到原对话', kind: 'primary' },
    ['panel', 'engine', '轮询']
  ]
});

// ---------- 02 high-level ----------
add('02-high-level', {
  type: 'high-level', title: 'dsh-superagent 是什么', subtitle: '给非工程师的 30 秒版本',
  caption: CAP + '；研究原型，非官方产品。',
  nodes: [
    { id: 'you', label: '你', kind: 'external', row: 1, col: 0 },
    { id: 'chat', label: 'GitHub / 飞书', sub: 'issue · 评论 · 群聊', row: 0, col: 1 },
    { id: 'agent', label: '超级代理', sub: ' listens & works', focal: true, row: 1, col: 1 },
    { id: 'repo', label: '你的仓库', sub: '自己的会话与目录', row: 2, col: 1 },
    { id: 'pr', label: 'PR / 回复', sub: '出现在原对话', row: 1, col: 2 }
  ],
  edges: [
    ['you', 'chat', '说一句活儿'],
    { from: 'chat', to: 'agent', label: '被允许的请求', kind: 'primary' },
    { from: 'agent', to: 'repo', label: '开工', kind: 'primary' },
    { from: 'repo', to: 'pr', label: '交付' },
    ['pr', 'you', '通知你']
  ]
});

// ---------- 03 deployment ----------
add('03-deployment', {
  type: 'deployment', title: '跑在哪里：单进程 tmux', subtitle: 'dsh --profile superagent 一个常驻进程',
  caption: 'docs/006：无 Docker/systemd；scripts/dsh-superagent（Python）管理 tmux 会话与退出码巡检。',
  budget: 'faithful',
  evidence: [{ id: 'dep', file: 'docs/006-deployment.md', line: 7 }, { id: 'svc', file: 'scripts/dsh-superagent', line: 1 }],
  groups: [
    { id: 'host', label: '宿主机', style: 'dashed' }
  ],
  nodes: [
    { id: 'op', label: '运营者', kind: 'external', row: 0, col: 0 },
    { id: 'tmux', label: 'tmux: dsh-superagent', group: 'host', row: 1, col: 1 },
    { id: 'dsh', label: 'dsh --profile superagent', sub: 'bundle patch 注入', group: 'host', focal: true, row: 2, col: 1 },
    { id: 'state', label: 'stateDir', sub: 'sqlite + work/', kind: 'store', group: 'host', row: 3, col: 0 },
    { id: 'web', label: '面板端口', sub: 'webserver 配置', group: 'host', row: 2, col: 2 },
    { id: 'ghc', label: 'gh cli', sub: '子进程', group: 'host', row: 1, col: 2 },
    { id: 'lark', label: 'lark-cli', sub: '事件子进程', group: 'host', row: 3, col: 2 }
  ],
  edges: [
    { from: 'op', to: 'web', label: '浏览器', kind: 'primary' },
    { from: 'tmux', to: 'dsh', label: '常驻', kind: 'primary' },
    ['dsh', 'state', '状态'],
    ['dsh', 'ghc', '轮询通知'],
    ['dsh', 'lark', '实时事件'],
    ['web', 'dsh', '同源 API']
  ]
});

// ---------- 04 dependency ----------
add('04-dependency', {
  type: 'dependency', dir: 'TB', title: '模块依赖（自上而下）', subtitle: 'client/app/sources → core 内核 → 端口与基础设施',
  caption: '依赖方向依据 SC scan 的 import 分析；直接第三方依赖只有 proper-lockfile 与 zod 两个，其余 24 个全是 @deepseek-ai/* peer 包。',
  budget: 'faithful',
  nodes: [
    { id: 'panel', label: 'client 面板', sub: '26 文件', row: 0, col: 0 },
    { id: 'app', label: 'app 编排', sub: '38 文件', row: 0, col: 2 },
    { id: 'tests', label: 'tests', sub: '65 文件', kind: 'external', row: 0, col: 4 },
    { id: 'sources', label: 'sources 接入', sub: '16 文件', row: 1, col: 1 },
    { id: 'executor', label: 'executor', sub: 'DSH 执行', row: 1, col: 3 },
    { id: 'core', label: 'core 内核', sub: '15 文件 · 零外部依赖', focal: true, row: 2, col: 2 },
    { id: 'infra', label: 'infra', sub: 'gh/lark/git 封装', row: 3, col: 1 },
    { id: 'peer', label: '@deepseek-ai/* ×24', sub: 'peerDependencies', kind: 'external', row: 3, col: 3 }
  ],
  edges: [
    ['panel', 'app'], ['app', 'core'], ['app', 'sources'], ['app', 'executor'],
    ['sources', 'infra'], ['executor', 'app'], ['executor', 'core'], ['tests', 'app'],
    { from: 'core', to: 'infra', label: '仅端口', kind: 'primary' },
    ['infra', 'peer'], ['executor', 'peer']
  ]
});

// ---------- 05 architecture-delta ----------
add('05-architecture-delta', {
  type: 'architecture-delta', title: '架构增量：挂进 DSH 宿主', subtitle: '一个 bundle patch 注入三个插件与两个预设',
  caption: 'cordis.patch.yml：insert dsh-superagent / github-watch（feishu-watch 默认 disabled）+ worker/router 两个 agent 预设。',
  evidence: [{ id: 'patch', file: 'cordis.patch.yml', line: 4 }],
  nodes: [
    { id: 'base', label: 'DSH 宿主', sub: 'dsh ^0.2.1-alpha.2', change: 'changed', row: 1, col: 0 },
    { id: 'sa', label: 'dsh-superagent 插件', sub: 'Engine + 面板', change: 'added', focal: true, row: 1, col: 1 },
    { id: 'gw', label: 'github-watch', sub: 'gh cli 轮询', change: 'added', row: 0, col: 1 },
    { id: 'fw', label: 'feishu-watch', sub: '默认 disabled', change: 'added', row: 2, col: 1 },
    { id: 'preset', label: 'worker/router 预设', sub: 'shell 5s 转后台', change: 'added', row: 1, col: 2 },
    { id: 'db', label: 'orchestrator.sqlite', kind: 'store', change: 'added', row: 0, col: 2 },
    { id: 'web', label: '/orchestrator/api', sub: '面板路由', change: 'added', row: 2, col: 2 }
  ],
  edges: [
    { from: 'base', to: 'sa', label: 'patch 挂载', change: 'added', kind: 'primary' },
    { from: 'sa', to: 'gw', change: 'added' },
    { from: 'sa', to: 'fw', change: 'added' },
    { from: 'sa', to: 'preset', change: 'added' },
    { from: 'sa', to: 'db', change: 'added' },
    { from: 'sa', to: 'web', change: 'added' }
  ]
});

// ---------- 06 it-state ----------
add('06-it-state', {
  type: 'it-state', title: '子系统健康度', subtitle: '研究原型的成熟度地图',
  caption: '状态为分析性判断：ok=有测试与文档双重支撑；risk=README 明示研究代码、可能含 bug；legacy=附属件。',
  budget: 'faithful',
  nodes: [
    { id: 'core', label: 'core 领域内核', sub: '2088 行 · 纯函数式', status: 'ok', focal: true, row: 0, col: 1 },
    { id: 'app', label: 'app 编排', sub: '5292 行 · 工具/视图', status: 'ok', row: 0, col: 2 },
    { id: 'test', label: 'tests', sub: '14960 行 · 59 spec', status: 'ok', row: 1, col: 0 },
    { id: 'docs', label: 'docs 000-008', sub: '1973 行 · 按序阅读', status: 'ok', row: 0, col: 0 },
    { id: 'src', label: 'sources 接入', sub: 'GitHub/飞书', status: 'ok', row: 1, col: 1 },
    { id: 'client', label: 'client 面板', sub: '4419 行 · 轮询', status: 'ok', row: 1, col: 2 },
    { id: 'prompt', label: 'prompts/skills', sub: '15 部件 · 可版本化', status: 'risk', row: 2, col: 0 },
    { id: 'proto', label: '整体', sub: '研究原型 · 单次发布', status: 'risk', row: 2, col: 2 }
  ],
  edges: [
    ['core', 'app'], ['app', 'src'], ['app', 'client'], ['test', 'core'], ['docs', 'core'], ['prompt', 'app'], ['proto', 'core']
  ]
});

// ---------- 07 uml-class ----------
add('07-uml-class', {
  type: 'uml-class', dir: 'TB', title: '核心接口：Engine 与端口', subtitle: '五个 EnginePart、五个端口、两个适配器',
  caption: '依据 src/core/engine.ts:24、ports.ts 与 app/assessment.ts:89、executor/dsh.ts。',
  evidence: [{ id: 'ports', file: 'src/core/ports.ts', line: 17 }],
  nodes: [
    { id: 'engine', label: 'Engine', tag: '«事务入口»', focal: true, methods: ['receive()', 'evaluateDue()', 'decide()', 'report()'], row: 0, col: 1 },
    { id: 'part', label: 'EnginePart', tag: '«基类»', methods: ['intake', 'evals', 'tickets', 'assignments', 'replies'], row: 1, col: 1 },
    { id: 'assessor', label: 'Assessor', tag: '«端口»', methods: ['request(card)'], row: 2, col: 0 },
    { id: 'executor', label: 'Executor', tag: '«端口»', methods: ['start(assignment)'], row: 2, col: 2 },
    { id: 'master', label: 'MasterAssessor', tag: '主会话', row: 3, col: 0 },
    { id: 'dsh', label: 'DshExecutor', tag: '双会话', row: 3, col: 2 }
  ],
  edges: [
    ['engine', 'part', '持有'],
    { from: 'engine', to: 'assessor', label: '评估', kind: 'primary' },
    { from: 'engine', to: 'executor', label: '派工', kind: 'primary' },
    ['master', 'assessor', '', 'implements'],
    ['dsh', 'executor', '', 'implements']
  ]
});

// ---------- 08 er ----------
add('08-er', {
  type: 'er', title: '领域模型：从 Trigger 到 Assignment', subtitle: '概念最少化的数据流',
  caption: 'docs/001-domain.md:7-19 与 src/core/model.ts；Ticket 终态只有 ended，outcome 五值。',
  evidence: [{ id: 'model', file: 'src/core/model.ts', line: 23 }],
  nodes: [
    { id: 'trig', label: 'Trigger', fields: ['id PK', 'actor', 'human', 'addressed', 'text', 'channel'], row: 0, col: 0 },
    { id: 'thread', label: 'Thread', fields: ['key PK', 'subscriptions', 'correlated'], row: 0, col: 1 },
    { id: 'eval', label: 'Evaluation', fields: ['id PK', 'deadline', 'requeues≤2'], row: 1, col: 1 },
    { id: 'dec', label: 'Decision', fields: ['id PK', 'kind', 'rationale'], row: 2, col: 1 },
    { id: 'man', label: 'Mandate', fields: ['strength', 'policyVersion', 'basis'], row: 2, col: 2 },
    { id: 'ticket', label: 'Ticket', fields: ['id PK', 'ended', 'outcome', 'follows'], focal: true, row: 2, col: 3 },
    { id: 'asg', label: 'Assignment', fields: ['id PK', 'state', 'report'] },
    { id: 'reply', label: 'Reply', fields: ['purpose', 'idempotencyKey'] }
  ],
  edges: [
    { from: 'trig', to: 'thread', label: '归属', kind: 'primary' },
    { from: 'thread', to: 'eval', label: '排队', kind: 'primary' },
    ['eval', 'dec', '裁决'],
    ['dec', 'man', 'accept 时签发'],
    { from: 'man', to: 'ticket', label: '创建', kind: 'primary' },
    ['ticket', 'asg', '1:N'],
    ['ticket', 'reply', '确认/结果']
  ]
});

// ---------- 09 db-schema ----------
add('09-db-schema', {
  type: 'db-schema', title: 'orchestrator.sqlite 真实表结构', subtitle: 'JSON 文档仓储：9 张表全是 key/value',
  caption: 'src/app/store.ts:64-86：WAL + synchronous=FULL；业务字段整体存 value TEXT(JSON)，单写者事务保证一致性。',
  evidence: [{ id: 'store', file: 'src/app/store.ts', line: 64 }],
  nodes: [
    { id: 'trigger', label: 'trigger', focal: true, fields: [['id', 'TEXT', 'PK'], ['value', 'JSON', ''], ['at', 'TEXT', 'idx']] },
    { id: 'thread', label: 'thread', fields: [['key', 'TEXT', 'PK'], ['value', 'JSON', '']] },
    { id: 'ticket', label: 'ticket', fields: [['id', 'TEXT', 'PK'], ['value', 'JSON', '']] },
    { id: 'decision', label: 'decision', fields: [['id', 'TEXT', 'PK'], ['thread', 'TEXT', 'idx'], ['value', 'JSON', '']] },
    { id: 'outbox', label: 'outbox', fields: [['id', 'TEXT', 'PK'], ['value', 'JSON', '']] },
    { id: 'effect', label: 'effect', fields: [['kind', 'TEXT', 'idx'], ['key', 'TEXT', ''], ['due', 'INT', 'idx'], ['seq', 'INT', '']] },
    { id: 'kv', label: 'kv', fields: [['key', 'TEXT', 'PK'], ['value', 'TEXT', '']] }
  ],
  edges: [
    { from: 'decision.thread', to: 'thread.key', label: '逻辑关联', kind: 'primary' },
    ['effect.kind', 'effect.due', '泵扫描序', 'many-one'],
    ['trigger.at', 'trigger.id', '时间索引', 'many-one']
  ]
});

// ---------- 10 flowchart ----------
add('10-flowchart', {
  type: 'flowchart', title: '一条消息的准入决策流', subtitle: '从 Trigger 到 Ticket 的六道闸',
  caption: '依据 intake.ts 与 policy.ts gate：去重 → scope → 订阅直达/Eval 排队 → admission 表 → LLM 评估。',
  evidence: [{ id: 'gate', file: 'src/policy.ts', line: 191 }, { id: 'intake', file: 'src/core/intake.ts', line: 16 }],
  nodes: [
    { id: 's', label: 'Trigger 到达', shape: 'terminal', row: 0, col: 1 },
    { id: 'd1', label: '重复 / scope 外？', shape: 'decision', row: 1, col: 1 },
    { id: 'n1', label: '丢弃（duplicate/filtered）', row: 1, col: 0 },
    { id: 'd2', label: '已有订阅 Ticket？', shape: 'decision', row: 2, col: 1 },
    { id: 'n2', label: '直达该 Ticket（fan-out）', row: 2, col: 0 },
    { id: 'd3', label: 'admission 表判定', shape: 'decision', row: 3, col: 1 },
    { id: 'n3', label: 'ignore（记录原因）', row: 3, col: 0 },
    { id: 'n4', label: 'Eval 排队 → 主会话评估', focal: true, row: 3, col: 2 },
    { id: 'e', label: 'accept → Mandate → Ticket', shape: 'terminal', row: 4, col: 2 }
  ],
  edges: [
    ['s', 'd1'],
    { from: 'd1', to: 'n1', label: '是' },
    { from: 'd1', to: 'd2', label: '否' },
    { from: 'd2', to: 'n2', label: '是', kind: 'primary' },
    { from: 'd2', to: 'd3', label: '否' },
    { from: 'd3', to: 'n3', label: 'ignore' },
    { from: 'd3', to: 'n4', label: 'explicit/inferred', kind: 'primary' },
    { from: 'n4', to: 'e', label: 'accept', kind: 'primary' }
  ]
});

// ---------- 11 sequence ----------
add('11-sequence', {
  type: 'sequence', title: '一次请求的时序', subtitle: '从 @提到 PR 回来',
  caption: '依据 engine.ts、evals.ts 与 executor/dsh.ts：Effects 持久队列 + Passes 2s 泵驱动。',
  evidence: [{ id: 'pump', file: 'src/app/passes.ts', line: 28 }],
  numbered: true,
  participants: [
    { id: 'hu', label: '请求者', kind: 'external' },
    { id: 'src', label: 'Source watcher' },
    { id: 'eng', label: 'Engine', kind: 'focal' },
    { id: 'orch', label: '主会话' },
    { id: 'wrk', label: 'Worker 会话' },
    { id: 'out', label: 'Outbox' }
  ],
  messages: [
    ['hu', 'src', '@superagent 修一下这个 issue'],
    ['src', 'eng', 'Trigger（去重后）'],
    ['eng', 'eng', 'Eval 入队 → Passes 泵出'],
    ['eng', 'orch', '候选卡（deadline 内）'],
    ['orch', 'eng', 'eval_decide: accept + Mandate'],
    ['eng', 'out', '确认回复（幂等）'],
    ['eng', 'wrk', 'Assignment：prepare worktree + 新会话'],
    ['wrk', 'wrk', '后台干活（30 分钟上限）'],
    ['wrk', 'eng', 'report: ready + PR'],
    ['eng', 'out', 'result 回复 → 原对话']
  ],
  fragments: [{ kind: 'loop', label: 'Passes 每 2s 泵', from: 2, to: 3 }]
});

// ---------- 12 state ----------
add('12-state', {
  type: 'state', title: 'Ticket 生命周期', subtitle: '宏观两态，终态五值，可被人的消息唤醒',
  caption: 'model.ts:277-308 与 tickets.ts：ended 只有 executor/human 两种 endBy；wake 复用原 Mandate 需 revalidate。',
  evidence: [{ id: 'wake', file: 'src/core/tickets.ts', line: 252 }],
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'open', label: 'open（live）', sub: 'assignments 推进', focal: true, row: 0, col: 1 },
    { id: 'exec', label: 'endBy executor', row: 1, col: 2 },
    { id: 'done', shape: 'end', sub: 'completed/merged/closed/dropped', row: 1, col: 3 },
    { id: 'human', label: 'endBy human', sub: 'stop 工具', row: 2, col: 2 },
    { id: 'stop', shape: 'end', sub: 'stopped', row: 2, col: 3 },
    { id: 'wake', label: 'wake：删除 ended', sub: 'explicit 消息 + revalidate', row: 2, col: 1 }
  ],
  edges: [
    ['s', 'open', 'accept 建单'],
    { from: 'open', to: 'exec', label: 'report ready/dropped', kind: 'primary' },
    { from: 'exec', to: 'done', kind: 'primary' },
    { from: 'open', to: 'human', label: 'orchestrator stop' },
    { from: 'human', to: 'stop' },
    { from: 'wake', to: 'open', label: '复活', kind: 'primary' },
    { from: 'done', to: 'wake', label: '人在原线程追问' },
    { from: 'stop', to: 'wake', label: '人在原线程追问' }
  ]
});

// ---------- 13 swimlane ----------
add('13-swimlane', {
  type: 'swimlane', title: '一次工单的全流程（跨职能）', subtitle: '人只说一句话，中间全自动',
  caption: 'docs/003 阶段表 + executor/dsh.ts 启动链；人的追问随时可插入。',
  budget: 'faithful',
  lanes: [
    { id: 'req', label: '请求者' },
    { id: 'src', label: 'Source/Intake' },
    { id: 'orch', label: '主会话' },
    { id: 'wrk', label: 'Worker 会话' },
    { id: 'gh', label: 'GitHub 仓库' }
  ],
  nodes: [
    { id: 'ask', label: '@提需求', lane: 'req', col: 0 },
    { id: 'dedup', label: '去重/准入', lane: 'src', col: 1 },
    { id: 'judge', label: '评估 accept', lane: 'orch', col: 2, focal: true },
    { id: 'ack', label: '确认回复', lane: 'src', col: 3 },
    { id: 'prep', label: 'worktree + 会话', lane: 'wrk', col: 4 },
    { id: 'code', label: '后台干活', lane: 'wrk', col: 5 },
    { id: 'push', label: '开 PR', lane: 'gh', col: 6 },
    { id: 'res', label: 'result 通知', lane: 'req', col: 7 }
  ],
  edges: [
    ['ask', 'dedup'], { from: 'dedup', to: 'judge', kind: 'primary' }, ['judge', 'ack'],
    { from: 'judge', to: 'prep', kind: 'primary' }, ['prep', 'code'], ['code', 'push'], ['push', 'res']
  ]
});

// ---------- 14 process ----------
add('14-process', {
  type: 'process', title: '五步装起来', subtitle: 'SETUP.md：让编码代理带着你装',
  caption: 'README/SETUP.md：问答一次一步，先只读不改；装完从 observe 模式起步。',
  steps: [
    { label: '叫来你的代理', sub: '“读 SETUP.md 和我一起装”' },
    { label: '建 DSH profile', sub: 'stateDir + bundle patch' },
    { label: '接 GitHub', sub: 'gh cli 授权 + 仓库名单' },
    { label: '接飞书（可选）', sub: 'lark-cli 事件订阅' },
    { label: '起 tmux 服务', sub: 'scripts/dsh-superagent start' }
  ]
});

// ---------- 15 data-flow ----------
add('15-data-flow', {
  type: 'data-flow', title: '运行数据的数据流', subtitle: '一次写入，三路消费',
  caption: 'notifications/IM 事件归一化为 Trigger 后全部经 SQLite 单写者；Outbox 幂等外发，面板只读快照。',
  budget: 'faithful',
  evidence: [{ id: 'outbox', file: 'src/core/replies.ts', line: 36 }],
  nodes: [
    { id: 'gh2', label: 'GitHub 通知/CI', kind: 'input', row: 0, col: 0 },
    { id: 'lark', label: '飞书事件/回填', kind: 'input', row: 1, col: 0 },
    { id: 'trig', label: 'Trigger 归一化', sub: '确定性 ID', row: 0, col: 1 },
    { id: 'db3', label: 'SQLite', sub: 'trigger/ticket/effect…', kind: 'store', row: 1, col: 1 },
    { id: 'ob', label: 'Outbox', sub: '按序退避', row: 2, col: 1 },
    { id: 'reply', label: '回到 GitHub/飞书', kind: 'external', row: 2, col: 2 },
    { id: 'snap', label: '视图快照', sub: 'views/*.ts', row: 0, col: 2 },
    { id: 'panel2', label: '面板 5s 轮询', kind: 'external', focal: true, row: 0, col: 3 }
  ],
  edges: [
    ['gh2', 'trig'], ['lark', 'trig'],
    { from: 'trig', to: 'db3', label: '原子写入', kind: 'primary' },
    ['db3', 'ob', '待发回复'],
    { from: 'ob', to: 'reply', kind: 'primary' },
    ['db3', 'snap'],
    { from: 'snap', to: 'panel2', label: 'GET /orchestrator/api', kind: 'primary' }
  ]
});

// ---------- 16 journey ----------
add('16-journey', {
  type: 'journey', title: '运营者旅程', subtitle: '从装好到放心托管一个仓库',
  caption: '情绪得分为分析性推断；阶段对应 docs/000 的运维建议（窄名单起步、observe 先行）。',
  stages: [
    { label: '安装', steps: [{ label: '代理带着走 SETUP.md', score: 1 }, { label: 'profile + tmux 起服务', score: 0 }] },
    { label: '试运行', steps: [{ label: 'off/observe 模式只看不干', score: 1 }, { label: '面板读 would-accept 记录', score: 2 }] },
    { label: '授权', steps: [{ label: '写规则、收紧 admission 表', score: 0 }, { label: '切 auto 放行第一批', score: -1 }] },
    { label: '托管', steps: [{ label: '只看“待人”清单', score: 2 }, { label: '被追问唤醒或 stop', score: 1 }] },
    { label: '复盘', steps: [{ label: 'rejected 原因读一遍', score: -1 }, { label: '调 prompts/policy 版本', score: 1 }] }
  ]
});

// ---------- 17 timeline ----------
add('17-timeline', {
  type: 'timeline', title: '从内部原型到公开发布', subtitle: '单次 squash 发布的研究原型',
  caption: CAP + '；上游仅 1 个提交、1 位作者（团队署名），论文所述部分设计未在本原型实现。',
  events: [
    { date: '2026-10-31', label: '首次公开推送（唯一提交）' },
    { date: '2026-11-01', label: '本分析采集 · v0.1.0' }
  ],
  periods: [
    { from: '2026-08', to: '2026-10', label: '内部孵化（日期为推断）' },
    { from: '2026-10', to: '2026-10', label: '整理发布' },
    { from: '2026-11', to: '2026-12', label: '开放演进（论文方向未实现）' }
  ]
});

// ---------- 18 gantt ----------
add('18-gantt', {
  type: 'gantt', title: '发布阶段甘特图', subtitle: '单提交仓库的三段式生命周期',
  caption: CAP + '；内部孵化区间无 git 证据，日期为推断（虚线段）。',
  today: '2026-11-01',
  tasks: [
    { id: 'a', label: '内部孵化与日常打磨', section: '发布前', start: '2026-09-01', end: '2026-10-30', done: true },
    { id: 'b', label: '脱敏整理 + docs 000-008', section: '发布前', start: '2026-10-15', end: '2026-10-31', done: true },
    { id: 'c', label: '公开原型维护', section: '发布后', start: '2026-10-31', end: '2026-12-31', done: false }
  ],
  milestones: [{ label: 'v0.1.0 发布', date: '2026-10-31' }]
});

// ---------- 19 kanban ----------
add('19-kanban', {
  type: 'kanban', title: '执行阶段看板', subtitle: '面板把 Ticket 归入的stage 分类',
  caption: '列名为 docs/003-execution.md:9-19 的真实 stage；面板按 person/working/idle/ended 聚合（core/stage.ts）。',
  columns: [
    { label: 'person', cards: [{ label: '等人处理', tag: '优先' }, { label: 'blocked / failed', tag: '停自动投递' }] },
    { label: 'working', cards: [{ label: '会话回合进行中', tag: '占槽' }, { label: '后台 job ≤30 分钟', tag: '上限' }] },
    { label: 'queued', cards: [{ label: 'launch/delivery 排队', tag: 'Effects' }, { label: '槽满等待', tag: 'WorkerSlots' }] },
    { label: 'review / answer', cards: [{ label: 'ready 待核对', tag: 'delivery' }, { label: '等 worker 回答', tag: 'answer' }] },
    { label: 'ended', cards: [{ label: 'completed/merged/…', tag: 'executor' }, { label: 'stopped', tag: 'human' }] }
  ]
});

// ---------- 20 story-map ----------
add('20-story-map', {
  type: 'story-map', title: '产品故事图', subtitle: '主干活动 × 实现切片',
  caption: '切片依据 README：已实现=本原型可验证；论文方向=《Exploring Super-agent Design》所述未实现部分。',
  releases: ['已实现', '论文方向'],
  activities: [
    { label: '听', focal: true, steps: [{ label: 'GitHub 轮询', stories: { '已实现': ['notifications + 仓库流 + CI'], '论文方向': ['更多 Source'] } }, { label: '飞书接入', stories: { '已实现': ['事件 + 60s 回填'], '论文方向': ['跨源身份映射'] } }] },
    { label: '断', steps: [{ label: 'admission 表', stories: { '已实现': ['三格默认值可配'], '论文方向': ['自主学习规则'] } }, { label: '主会话评估', stories: { '已实现': ['候选卡 + deadline'], '论文方向': ['更强规划'] } }] },
    { label: '干', steps: [{ label: '每单一会话', stories: { '已实现': ['worktree 隔离 + 槽位'], '论文方向': ['多仓协同'] } }] },
    { label: '说', steps: [{ label: '四种回复目的', stories: { '已实现': ['ack/answer/result/attention'], '论文方向': ['主动汇报节奏'] } }] }
  ]
});

// ---------- 21 loop ----------
add('21-loop', {
  type: 'loop', title: 'Policy 调优飞轮', subtitle: 'observe → 复盘 → 放宽 → 复盘',
  caption: 'docs/000 运维建议 + policy.ts observe 模式：先只记录 would-accept，人工复核后再放行。',
  center: '授权边界',
  centerSub: 'policyVersion',
  steps: [
    { label: 'observe 记录', sub: 'would-accept' },
    { label: '面板复盘', sub: 'Evaluation 列表' },
    { label: '调整规则', sub: 'policy_sync / settings' },
    { label: 'auto 放行', sub: 'inferred 可 accept' },
    { label: '结果回流', sub: 'rejected 原因' }
  ]
});

// ---------- 22 medallion ----------
add('22-medallion', {
  type: 'medallion', title: '事件数据的分层加工', subtitle: '原始消息 → 归一化 Trigger → 决策记录',
  caption: '层名为数据平台类比；物品均取自仓库真实组件（github-trigger.ts、store.ts、views/*.ts）。',
  stages: [
    { label: '原始层', plain: true, kind: 'input', items: ['GitHub notifications', 'lark 事件流', 'CI 状态'] },
    { label: '结构层', items: ['Trigger 确定性 ID', 'Thread 关联/去重', 'Evaluation/Decision 记录'] },
    { label: '应用层', items: ['面板快照视图', 'Outbox 幂等回复', '回合审计'] }
  ]
});

// ---------- 23 dp-integration ----------
add('23-dp-integration', {
  type: 'dp-integration', title: '多源事件集成', subtitle: '两种通道汇入一个单写者平台',
  caption: '依据 sources/kind.ts 契约与 docs/008：新 Source 只需实现 schema/channel/policy 等八件套。',
  evidence: [{ id: 'kind', file: 'src/sources/kind.ts', line: 85 }],
  stages: [
    { label: '来源', plain: true, kind: 'external', items: [{ id: 'ghe', label: 'GitHub 通知/CI' }, { id: 'fse', label: '飞书事件' }] },
    { label: '接入', items: [{ id: 'norm', label: 'Trigger 归一化' }, { id: 'poll', label: '14 天轮询视野' }] },
    { label: '平台', items: [{ id: 'sq', label: 'SQLite 单写者' }, { id: 'fx', label: 'Effects 队列' }] },
    { label: '消费', items: [{ id: 'pn', label: '面板轮询' }, { id: 'rp', label: 'Outbox 回复' }] }
  ],
  edges: [['ghe', 'norm'], ['fse', 'norm'], { from: 'norm', to: 'sq', kind: 'primary' }, ['norm', 'fx'], ['sq', 'pn'], ['sq', 'rp'], { from: 'fx', to: 'rp', kind: 'primary' }]
});

// ---------- 24 dp-security-matrix ----------
add('24-dp-security-matrix', {
  type: 'dp-security-matrix', title: '访问矩阵：四个主体碰什么', subtitle: '会话隔离是硬边界',
  caption: '等级：none < read < write；worker 的 read 工具仅限本 Ticket（sessions.ts 限流），面板读者=同源运营者。',
  rows: ['主会话', 'worker 会话', '面板读者', 'Source 插件'],
  cols: ['Trigger 原文', 'Thread 上下文', 'SQLite 状态', 'Policy/设置', '凭据'],
  cells: [
    ['read', 'read', 'write', 'write', 'none'],
    ['none', 'read', 'none', 'none', 'none'],
    ['read', 'read', 'read', 'write', 'none'],
    ['write', 'read', 'none', 'read', 'none']
  ],
  focal: 'worker 会话'
});

// ---------- 25 tree ----------
add('25-tree', {
  type: 'tree', title: '仓库目录结构', subtitle: '216 个文件的分布',
  caption: CAP + '；括号内为行数。',
  budget: 'faithful',
  root: {
    label: 'dsh-superagent/', children: [
      { label: 'src/', sub: '应用本体', children: [
        { label: 'app/ (5292)', sub: '编排：评估/工具/视图' },
        { label: 'client/ (4419)', sub: '面板 6 Tab' },
        { label: 'core/ (2088)', sub: '领域内核·零依赖' },
        { label: 'sources/ (2059)', sub: 'GitHub/飞书接入' },
        { label: 'executor/ (838)', sub: 'DSH 双会话执行' },
        { label: 'infra/ (347)', sub: 'gh/lark/git 封装' }
      ] },
      { label: 'tests/ (14960)', sub: '59 spec + fixtures' },
      { label: 'docs/ (1973)', sub: '000-008 按序阅读' },
      { label: 'prompts/ (438)', sub: '15 部件 + team 三段' },
      { label: 'skills/ scripts/ locale/', sub: 'SKILL·服务·文案' }
    ]
  }
});

// ---------- 26 org-chart ----------
add('26-org-chart', {
  type: 'org-chart', title: '会话「组织架构」', subtitle: '一个主脑，按单雇工',
  caption: '依据 app/runtime.ts:104 与 executor/dsh.ts:24：主会话常驻，worker 每单一个、随单存亡。',
  budget: 'faithful',
  root: {
    label: 'DSH 宿主', sub: 'profile: superagent', children: [
      { label: '主会话 orchestrator', sub: '评估·路由·回复', children: [
        { label: 'worker-<ticketId>', sub: '每 Ticket 一个' },
        { label: 'worker-<ticketId>', sub: '随单结束退役' },
        { label: '子代理', sub: '随回合起止' }
      ] },
      { label: 'Source 插件', sub: 'github / feishu watch' },
      { label: 'Passes 泵', sub: '2s 扫 Effects' }
    ]
  }
});

// ---------- 27 nested ----------
add('27-nested', {
  type: 'nested', title: '执行隔离嵌套', subtitle: '从宿主到一次后台 job',
  caption: '边界为分析性描绘：worktree 名=短名+ticketId 前 12 位（dsh.ts:97-111），后台工作 30 分钟强制上限。',
  budget: 'faithful',
  root: {
    label: '宿主机', children: [
      { label: 'dsh profile: superagent', sub: 'tmux 常驻', children: [
        { label: 'bundle 插件进程', sub: 'Engine + Sources', children: [
          { label: 'stateDir', sub: 'sqlite + Effects', children: [
            { label: 'executionRoot', sub: 'prepare 一次性', children: [
              { label: 'worktree/<name>-<id12>', sub: '每 Ticket 一棵', children: [
                { label: 'worker 会话回合', sub: '后台 job ≤30min' }
              ] }
            ] }
          ] }
        ] }
      ] }
    ]
  }
});

// ---------- 28 layers ----------
add('28-layers', {
  type: 'layers', title: '分层架构', subtitle: 'docs/007 的五层依赖规则',
  caption: '全部为仓库真实分层：core 零外部依赖，端口向内、适配器向外，每状态单写者。',
  layers: [
    { label: '接入层', sub: '监听世界', items: ['github-watch', 'feishu-watch', '面板路由'] },
    { label: '内核层', sub: '纯领域', items: ['Engine + 5 parts', 'model/ports'] },
    { label: '端口层', sub: '五个接口', items: ['Repositories', 'Policy', 'Assessor', 'Executor', 'Outbox'] },
    { label: '适配层', sub: '连到 DSH', items: ['SQLite store', 'MasterAssessor', 'DshExecutor'] },
    { label: '设施层', sub: '进程与 CLI', items: ['gh/lark/git 封装', 'Effects 队列', 'proper-lockfile'] }
  ]
});

// ---------- 29 isometric ----------
add('29-isometric', {
  type: 'isometric', title: '一台超级代理工作站', subtitle: '把部署形态画成实物',
  caption: '示意：显示器=面板 6 Tab，主机=tmux 常驻进程，外接盒=gh/lark CLI，文件柜=stateDir（sqlite+worktrees）。',
  parts: [
    { label: '桌面板', x: 0, y: 40, z: 0, w: 320, d: 200, h: 10, r: 4 },
    { label: '显示器（面板）', x: 40, y: 0, z: 10, w: 180, d: 10, h: 110, r: 3, kind: 'screen' },
    { label: '显示器支架', x: 120, y: 20, z: 10, w: 14, d: 10, h: 40 },
    { label: '主机（tmux 常驻）', x: 60, y: 70, z: 10, w: 120, d: 70, h: 46, r: 4, kind: 'housing' },
    { label: 'stateDir 文件柜', sub: 'sqlite+worktrees', x: 200, y: 120, z: 10, w: 60, d: 44, h: 26, kind: 'vault' },
    { label: 'gh / lark 外接盒', sub: 'CLI 子进程', x: 250, y: 60, z: 10, w: 60, d: 44, h: 30, kind: 'terminal' },
    { label: '键盘（SETUP 问答）', x: 60, y: 160, z: 10, w: 110, d: 30, h: 6, r: 2, kind: 'keys' }
  ]
});

// ---------- 30 exploded ----------
add('30-exploded', {
  type: 'exploded', title: '拆开 bundle 发布物', subtitle: 'package.json files 白名单的全部家当',
  caption: '示意拆解：依据 package.json "files" 与 tsdown 双产物（ESM node + CJS browser）。',
  parts: [
    { label: '发布外壳', sub: 'lib/ + 白名单', kind: 'housing', w: 190, d: 340, t: 16, r: 20 },
    { label: '三个 ESM 入口', sub: 'index + 两 watch + dts', w: 150, d: 60, t: 12 },
    { label: 'client.js', sub: 'CJS 浏览器包', w: 150, d: 60, t: 12 },
    { label: 'cordis.patch.yml', sub: '挂载清单', w: 150, d: 60, t: 10, kind: 'plate' },
    { label: 'prompts/ skills/', sub: '提示词与技能', w: 150, d: 60, t: 10 },
    { label: 'locale/', sub: 'en/zh 文案', w: 150, d: 60, t: 8, kind: 'chip' }
  ]
});

// ---------- 31 isometric-plan ----------
add('31-isometric-plan', {
  type: 'isometric-plan', title: '代码平面图', subtitle: '如果 src 是一个园区',
  caption: '面积为行数的示意比例；tests 演武场比全部业务代码还大（14960 行 vs 15043 行）。',
  plate: { w: 980, d: 500 },
  rooms: [
    { label: 'tests 演武场', sub: '14960 行 · 59 spec', x: 20, y: 20, w: 340, d: 280, walls: true, door: 'S' },
    { label: 'app 调度室', sub: '5292 行', x: 380, y: 20, w: 240, d: 180, walls: true, door: 'S' },
    { label: 'client 展厅', sub: '4419 行 · 6 Tab', x: 640, y: 20, w: 230, d: 160, walls: true, door: 'S' },
    { label: 'core 内务房', sub: '2088 行 · 零依赖', x: 380, y: 220, w: 160, d: 150, walls: true, door: 'N' },
    { label: 'sources 门房', sub: '2059 行', x: 560, y: 220, w: 160, d: 150, walls: true, door: 'N' },
    { label: 'docs 图书室', sub: '1973 行 · 9 篇', x: 740, y: 200, w: 220, d: 130, walls: true, door: 'W' },
    { label: 'executor 机房', sub: '838 行', x: 740, y: 350, w: 130, d: 110, walls: true, door: 'N' }
  ],
  boxes: [
    { x: 60, y: 340, w: 70, d: 40, h: 14, kind: 'desk', label: 'Engine' },
    { x: 160, y: 340, w: 70, d: 40, h: 14, kind: 'rack', label: 'Effects' },
    { x: 260, y: 340, w: 60, d: 40, h: 14, kind: 'screen', label: 'Passes' }
  ]
});

// ---------- 32 venn ----------
add('32-venn', {
  type: 'venn', title: '什么消息会被理', subtitle: '三个条件的交集决定授权强度',
  caption: '依据 docs/002 与 admission.ts 默认表：名单内+addressed 恒为 explicit（不在表内），默认其余偏保守。',
  sets: [
    { id: 'listed', label: '名单内的人' },
    { id: 'addr', label: '@提及 / 私聊' },
    { id: 'thread', label: '已有工单的 Thread' }
  ],
  overlaps: [
    { sets: ['listed', 'addr'], label: 'explicit 恒定' },
    { sets: ['listed', 'thread'], label: 'explicit 追问' },
    { sets: ['addr', 'thread'], label: 'inferred（默认）' },
    { sets: ['listed', 'addr', 'thread'], label: 'explicit' }
  ]
});

// ---------- 33 pyramid ----------
add('33-pyramid', {
  type: 'pyramid', title: '提示词效力金字塔', subtitle: '冲突时谁说了算',
  caption: 'docs/004-prompts.md:65-71 的效力排序；policy 段随每次模型请求重新生成。',
  unit: '阶',
  levels: [
    { label: '工具事实', value: 1, sub: '最高效力', focal: true },
    { label: '内置段', value: 2 },
    { label: 'matched rules', value: 3 },
    { label: '团队段', sub: 'communication/delivery/scope', value: 4 },
    { label: '外部文本', value: 5 }
  ]
});

// ---------- 34 quadrant ----------
add('34-quadrant', {
  type: 'quadrant', title: '面板导航矩阵：使用频率 × 决策影响', subtitle: '6 个 Tab 的心智图',
  caption: '位置为分析性判断；面板为 docs/005 的 Overview/Source/Trigger/Eval/Execution/Settings + 记录页。',
  x: { label: '使用频率', low: '低', high: '高' },
  y: { label: '决策影响', low: '低', high: '高' },
  quadrants: ['谨慎操作', '高频关键', '随用随查', '日常驾驶舱'],
  items: [
    { label: 'Overview', x: 0.9, y: 0.2, focal: true },
    { label: 'Threads', x: 0.8, y: 0.35 },
    { label: 'Tickets', x: 0.7, y: 0.55 },
    { label: 'Evals', x: 0.45, y: 0.75 },
    { label: 'Sources', x: 0.25, y: 0.5 },
    { label: 'Settings', x: 0.2, y: 0.85 },
    { label: 'Prompts', x: 0.35, y: 0.8 }
  ]
});

// ---------- 35 fishbone ----------
add('35-fishbone', {
  type: 'fishbone', title: '根因分析：什么会浪费团队注意力', subtitle: '哲学红线与代码里的五道防线',
  caption: '原因为仓库可见事实的归纳：每一类风险都有对应防御点（括号内）。',
  effect: '无效打扰（哲学红线）',
  categories: [
    { label: '准入太宽', focal: true, causes: ['admission 默认仅三格可调', '名单混入 bot（machineGate 拦）'] },
    { label: '自触发', causes: ['跳过自己的评论（github.ts:227）', '丢弃自身飞书消息'] },
    { label: '重复打扰', causes: ['确定性 ID 去重', 'Outbox/ack 幂等'] },
    { label: '评估卡壳', causes: ['deadline 重排 ≤2 次', '超时记 unavailable'] },
    { label: '规则含糊', causes: ['noRuleMatched → 安静 ignore', '提示词：拿不准不问人'] }
  ]
});

// ---------- 36 wardley ----------
add('36-wardley', {
  type: 'wardley', title: 'Wardley 演进图', subtitle: '超级代理在 agent 生态的位置',
  caption: '位置为分析性判断；evo 左=创世 右=商品化，vis 上=用户可见 下=基础设施。',
  components: [
    { id: 'need', label: '少占注意力地干完活', evo: 0.5, vis: 0.95, anchor: true },
    { id: 'sa2', label: '超级代理编排', evo: 0.32, vis: 0.7, focal: true },
    { id: 'dsha', label: '编码代理（DSH）', evo: 0.45, vis: 0.6 },
    { id: 'policy', label: '策略授权面', evo: 0.28, vis: 0.45 },
    { id: 'panelx', label: '注意力面板', evo: 0.4, vis: 0.8 },
    { id: 'ci', label: 'CI/自动化', evo: 0.8, vis: 0.5 },
    { id: 'llm', label: 'LLM API', evo: 0.85, vis: 0.2 },
    { id: 'git', label: 'Git/GitHub', evo: 0.95, vis: 0.35 }
  ],
  links: [['need', 'sa2'], ['sa2', 'dsha'], ['sa2', 'policy'], ['sa2', 'panelx'], ['dsha', 'llm'], ['dsha', 'git'], ['policy', 'ci'], ['sa2', 'ci']]
});

// ---------- 37 bar ----------
add('37-bar', {
  type: 'bar', orientation: 'horizontal', title: '各目录代码量 Top 10', subtitle: 'wc -l 全量统计',
  caption: CAP + '；测试代码（15.0 千行）几乎等于全部业务源码之和（15.0 千行）。',
  unit: '千行',
  sort: 'desc',
  focal: 'tests/',
  axis: '代码行数（千行）',
  data: [['tests/', 15.0], ['src/app', 5.3], ['src/client', 4.4], ['src/core', 2.1], ['src/sources', 2.1], ['docs/', 2.0], ['src/executor', 0.8], ['prompts/', 0.4], ['src/infra', 0.3], ['scripts/', 0.3]]
});

// ---------- 38 line ----------
add('38-line', {
  type: 'line', title: '文档厚度曲线', subtitle: '9 篇编号文档的行数（阅读顺序）',
  caption: CAP + '；007 架构篇与 008 手册篇占全部文档的一半以上。',
  unit: '行',
  smooth: false,
  area: true,
  zero: false,
  x: ['000', '001', '002', '003', '004', '005', '006', '007', '008'],
  series: [{ name: '行数', values: [33, 112, 155, 203, 96, 58, 274, 617, 425], focal: true }]
});

// ---------- 39 scatter ----------
add('39-scatter', {
  type: 'scatter', title: '各目录：文件数 × 代码量', subtitle: '一个点一个顶层目录',
  caption: CAP + '；tests 用 65 个文件承载 1.5 万行，是最大的单一目录。',
  xLabel: '文件数',
  yLabel: '代码行数（千行）',
  zero: false,
  points: [
    { label: 'tests', x: 65, y: 15.0, focal: true },
    { label: 'src/app', x: 38, y: 5.3 },
    { label: 'src/client', x: 27, y: 4.4 },
    { label: 'src/core', x: 15, y: 2.1 },
    { label: 'src/sources', x: 16, y: 2.1 },
    { label: 'docs', x: 9, y: 2.0 },
    { label: 'prompts', x: 15, y: 0.4 },
    { label: 'src/infra', x: 5, y: 0.3 },
    { label: 'src/executor', x: 2, y: 0.8 }
  ]
});

// ---------- 40 waterfall ----------
add('40-waterfall', {
  type: 'waterfall', title: '3.3 万行是怎么堆出来的', subtitle: '测试与源码几乎等量',
  caption: CAP + '；不含锁文件。',
  unit: '行',
  steps: [['tests/', 14960], ['src/app', 5292], ['src/client', 4419], ['src/core', 2088], ['src/sources', 2059], ['docs/', 1973], ['其余目录', 1923]]
});

// ---------- 41 treemap ----------
add('41-treemap', {
  type: 'treemap', title: '24 个 peer 依赖的构成', subtitle: 'package.json 依赖全景',
  caption: '来源 package.json：直接第三方只有 proper-lockfile 与 zod；peer 24 个全部 @deepseek-ai/*。',
  unit: '个',
  focal: 'peer @deepseek-ai/*',
  data: [
    { label: 'peer 内部包', children: [['peer @deepseek-ai/*', 24]] },
    { label: 'devDependencies', children: [['dev @deepseek-ai/*', 25], ['dev 第三方', 11]] },
    { label: 'dependencies', children: [['proper-lockfile', 1], ['zod', 1]] }
  ]
});

// ---------- 42 heatmap ----------
add('42-heatmap', {
  type: 'heatmap', title: '准入强度矩阵', subtitle: 'admission 默认表 + 恒定规则（数值：explicit=2 / inferred=1 / ignore=0）',
  caption: '依据 admission.ts:21 默认值与 docs/002：名单内人+addressed 恒为 explicit（不在表内）；其余默认偏保守，表格可配。',
  rows: ['名单内的人', '名单外的人', '名单内 bot', '其它 bot/CI'],
  cols: ['@提及', '私聊/定向', '工单追问', '无关消息'],
  values: [
    [2, 2, 2, 1],
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0]
  ]
});

// ---------- 43 radar ----------
add('43-radar', {
  type: 'radar', title: '工程化画像', subtitle: '对照典型研究原型的六维评估（1–5，分析性）',
  caption: '评分为依据仓库证据（tests≈src 等量、9 篇编号文档、15 个可版本化提示词部件）的相对判断。',
  axes: ['测试密度', '文档完备', '提示词治理', '概念最小化', '部署轻量', '可观测性'],
  max: 5,
  series: [
    { name: 'dsh-superagent', values: [5, 5, 5, 5, 4, 3], focal: true },
    { name: '典型研究原型', values: [2, 2, 1, 2, 3, 2] }
  ]
});

// ---------- 44 polar ----------
add('44-polar', {
  type: 'polar', title: '文档阅读罗盘', subtitle: '9 篇编号文档按阅读顺序排钟面，扇长=行数',
  caption: CAP + '；越靠 007/008 越厚——先读薄的前六篇即可上手。',
  center: '1973 行',
  focal: ['007', '008', '006'],
  data: [
    ['000', 33], ['001', 112], ['002', 155], ['003', 203],
    ['004', 96], ['005', 58], ['006', 274], ['007', 617], ['008', 425]
  ]
});

// ---------- 45 sankey ----------
add('45-sankey', {
  type: 'sankey', title: '3.3 万行去哪了', subtitle: '源码 / 测试 / 文档的构成',
  caption: 'wc -l 实测；测试 14960 行与源码 15043 行几乎 1:1，是该项目最鲜明的工程特征。',
  unit: '行',
  links: [
    ['全部 32714', '源码', 15043], ['全部 32714', '测试', 14960], ['全部 32714', '文档', 1973], ['全部 32714', '提示词', 438], ['全部 32714', '脚手架', 300],
    ['源码', 'app 编排', 5292], ['源码', 'client 面板', 4419], ['源码', 'core 内核', 2088], ['源码', 'sources 接入', 2059], ['源码', 'executor', 838], ['源码', 'infra', 347]
  ]
});

// ---------- 46 high-level-vertical ----------
add('46-high-level-vertical', {
  type: 'high-level-vertical', title: 'dsh-superagent 是什么（纵向）', subtitle: '窄幅布局，自上而下',
  caption: CAP,
  nodes: [
    { id: 'you', label: '你', kind: 'external', row: 0, col: 1 },
    { id: 'sa', label: '超级代理', sub: '听·断·干·说', focal: true, row: 1, col: 1 },
    { id: 'listen', label: '听', sub: 'GitHub/飞书 Source', row: 2, col: 0 },
    { id: 'judge', label: '断', sub: 'Policy + 主会话', row: 2, col: 1 },
    { id: 'work', label: '干', sub: 'worker 会话/worktree', row: 2, col: 2 },
    { id: 'reply', label: '回复', sub: 'ack/answer/result', row: 3, col: 1 }
  ],
  edges: [
    ['you', 'sa', '一句话需求'],
    { from: 'sa', to: 'listen', kind: 'primary' },
    { from: 'listen', to: 'judge', kind: 'primary' },
    { from: 'judge', to: 'work', label: 'accept', kind: 'primary' },
    { from: 'work', to: 'reply', label: 'PR', kind: 'primary' },
    { from: 'reply', to: 'you', label: '回到原对话' }
  ]
});

// ---------- 47 sequence-oauth ----------
add('47-sequence-oauth', {
  type: 'sequence-oauth', title: '授权裁决时序', subtitle: 'admission 门 → 显式直通 / LLM 评估',
  caption: '依据 policy.ts:191-211 gate：explicit 不经 LLM 直接签发 Mandate；inferred 仅 auto 模式可 accept。',
  evidence: [{ id: 'gate2', file: 'src/policy.ts', line: 191 }],
  participants: [
    { id: 'src', label: 'Source' },
    { id: 'eng', label: 'Engine' },
    { id: 'gate', label: 'admission 门', kind: 'focal' },
    { id: 'llm', label: '主会话' },
    { id: 'tk', label: 'Tickets' }
  ],
  messages: [
    ['src', 'eng', 'Trigger（actor/human/addressed）'],
    ['eng', 'gate', '名单内？addressed？表格格？'],
    ['gate', 'eng', 'explicit → 直接签 Mandate'],
    ['eng', 'tk', '创建 Ticket + 确认回复'],
    ['gate', 'llm', 'inferred + auto → 送候选卡'],
    ['llm', 'eng', 'eval_decide: accept/reopen/ignore'],
    ['eng', 'eng', 'ignore 记录原因，不回复']
  ],
  fragments: [{ kind: 'opt', label: 'observe 模式：只记 would-accept', from: 4, to: 6 }]
});

// ---------- 48 state-lifecycle ----------
add('48-state-lifecycle', {
  type: 'state-lifecycle', title: 'Worker 会话生命周期', subtitle: 'ensure 创建/复用，外部删除则重建',
  caption: '依据 executor/dsh.ts：回合结束 idle 结算后台；重启经 resume + RECOVERY_NOTE 续跑。',
  evidence: [{ id: 'resume', file: 'src/executor/dsh.ts', line: 524 }],
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'create', label: 'sessions.ensure', sub: 'worker-<ticketId>', row: 0, col: 1 },
    { id: 'run', label: 'running', sub: 'assignment 投递', focal: true, row: 0, col: 2 },
    { id: 'idle', label: 'idle', sub: '结算后台/报 waiting', row: 1, col: 2 },
    { id: 'gone', label: '被外部删除', row: 1, col: 1 },
    { id: 'end', shape: 'end', sub: 'shutdown 保留 inbox', row: 1, col: 0 }
  ],
  edges: [
    ['s', 'create'],
    { from: 'create', to: 'run', kind: 'primary' },
    { from: 'run', to: 'idle', label: '回合结束', kind: 'primary' },
    { from: 'idle', to: 'run', label: '新输入 steer' },
    { from: 'gone', to: 'create', label: '重建' },
    { from: 'idle', to: 'end', label: 'stop/shutdown' },
    { from: 'run', to: 'end', label: '宿主重启 → resume' }
  ]
});

// ---------- 49 funnel ----------
add('49-funnel', {
  type: 'funnel', title: '消息 → 工单的筛选漏斗', subtitle: '以 100 条消息为例的示意流量',
  caption: '数值为示意；每一层的过滤机制都是真实的：去重/scope → 订阅直达/Eval → admission 表 → LLM accept。',
  levels: [
    { label: '到达消息', value: 100 },
    { label: '过 scope+去重', value: 70 },
    { label: '进入 Eval（无订阅）', value: 30 },
    { label: 'admission 通过', value: 15 },
    { label: 'LLM accept → Ticket', value: 8 }
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
    if (j.ok) { ok++; console.log('✓', file, j.warnings?.length ? 'W: ' + j.warnings.map(w => w.code).join(',') : ''); }
    else { fail.push(file); console.log('✗', file, JSON.stringify(j).slice(0, 400)); }
  } catch (e) {
    fail.push(file); console.log('✗ ERR', file, String(e.stdout || e.message).slice(0, 400));
  }
}
console.log(`\n${ok}/${specs.length} ok${fail.length ? '；失败：' + fail.join(', ') : ''}`);
