#!/usr/bin/env node
// Mission Control · 45 种核心图表 + 4 种变体（共 49 张）批量生成器
// 事实依据：2026-11-01 本地克隆的 git 统计、openapi.json、四路代码深读（file:line 见各 spec.evidence）
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SC = 'node "C:/Users/ruijh/.agents/skills/seecode/scripts/seecode.mjs"';
const EYEBROW = 'Mission Control · 全方位分析';
const LANG = 'zh-CN';
const CAP = '数据来源：github.com/builderz-labs/mission-control（2026-11-01 本地克隆 + git/openapi 统计）';

const specs = [];
const add = (file, spec) => specs.push({ file, spec });

// ---------- 01 architecture ----------
add('01-architecture', {
  type: 'architecture', title: '总体架构：本地 Agent 控制平面', subtitle: '浏览器 → 边缘网关 → API/调度 → SQLite + OpenClaw 网关 → Agent',
  caption: '拉模式调度：scheduler 每 60s 扫 SQLite 派发，无消息队列；事件经唯一 SSE 通道推回前端。',
  budget: 'faithful',
  evidence: [{ id: 'sched', file: 'src/lib/scheduler.ts', line: 301 }, { id: 'bus', file: 'src/lib/event-bus.ts', line: 69 }],
  nodes: [
    { id: 'user', label: '操作者', kind: 'external', row: 1, col: 0 },
    { id: 'ui', label: '控制面板', sub: 'Next.js 16 · 36 面板', row: 0, col: 1 },
    { id: 'bus', label: '事件总线', sub: 'SSE /api/events', row: 0, col: 2 },
    { id: 'api', label: 'API 路由', sub: '253 端点 · 边缘网关', row: 1, col: 1 },
    { id: 'db', label: 'SQLite', sub: '48 表 · WAL', kind: 'store', row: 1, col: 2 },
    { id: 'sched', label: '调度器', sub: '12 任务 · 60s tick', row: 2, col: 1 },
    { id: 'disp', label: '任务派发', sub: 'task-dispatch', focal: true, row: 2, col: 2 },
    { id: 'gw', label: 'OpenClaw 网关', sub: 'WS RPC 协议 v3', row: 3, col: 2 },
    { id: 'rt', label: 'Agent 运行时', sub: 'claude/codex/…', row: 3, col: 3 }
  ],
  edges: [
    ['user', 'ui', '浏览器'],
    { from: 'ui', to: 'api', label: 'fetch + cookie' },
    { from: 'api', to: 'bus', label: '广播事件' },
    { from: 'bus', to: 'ui', label: 'SSE 实时推送', kind: 'primary' },
    ['api', 'db'],
    ['sched', 'disp', '60s tick'],
    ['disp', 'db', '抢占任务'],
    { from: 'disp', to: 'gw', label: '异步派发', kind: 'primary' },
    { from: 'gw', to: 'rt', label: '驱动会话' },
    ['api', 'sched', '手动触发']
  ]
});

// ---------- 02 high-level ----------
add('02-high-level', {
  type: 'high-level', title: 'Mission Control 是什么', subtitle: '给非工程师的 30 秒版本',
  caption: CAP,
  nodes: [
    { id: 'you', label: '你', kind: 'external', row: 1, col: 0 },
    { id: 'mc', label: 'Mission Control', sub: '本地仪表盘', focal: true, row: 1, col: 1 },
    { id: 'fleet', label: 'Agent 舰队', sub: 'OpenClaw / Claude Code / Codex', row: 0, col: 2 },
    { id: 'gw', label: '网关', sub: '本机 18789', row: 1, col: 2 },
    { id: 'db', label: '账本', sub: 'SQLite 单文件', kind: 'store', row: 2, col: 1 }
  ],
  edges: [
    ['you', 'mc', '派任务'],
    { from: 'mc', to: 'fleet', label: '调度执行', kind: 'primary' },
    ['mc', 'gw', '连接'],
    ['mc', 'db', '记账'],
    ['fleet', 'mc', '回传结果']
  ]
});

// ---------- 03 deployment ----------
add('03-deployment', {
  type: 'deployment', title: '跑在哪里：三种官方形态', subtitle: 'Docker / hardened overlay / standalone + systemd',
  caption: '依据 Dockerfile、docker-compose(.hardened).yml、install.sh 与 scripts/deploy-standalone.sh。',
  budget: 'faithful',
  evidence: [{ id: 'dk', file: 'Dockerfile', line: 53 }, { id: 'hn', file: 'docker-compose.hardened.yml', line: 15 }],
  groups: [
    { id: 'host', label: '宿主机', style: 'dashed' },
    { id: 'ctr', label: '容器（read_only · 非 root）' }
  ],
  nodes: [
    { id: 'br', label: '操作者浏览器', kind: 'external', row: 0, col: 0 },
    { id: 'mc', label: 'mission-control 容器', sub: 'node:24-slim · :3000', group: 'ctr', focal: true, row: 1, col: 1 },
    { id: 'vol', label: 'mc-data 卷', sub: '/app/.data', kind: 'store', group: 'ctr', row: 2, col: 0 },
    { id: 'net', label: 'mc-internal', sub: 'hardened：internal 出网禁止', group: 'ctr', row: 2, col: 2 },
    { id: 'gw', label: 'OpenClaw 网关', sub: '127.0.0.1:18789', group: 'host', row: 1, col: 3 },
    { id: 'std', label: 'standalone + systemd', sub: '免 Docker 形态', group: 'host', row: 0, col: 2 },
    { id: 'img', label: 'GHCR 多架构镜像', sub: 'amd64/arm64 · SBOM', kind: 'external', row: 3, col: 3 }
  ],
  edges: [
    { from: 'br', to: 'mc', label: 'HTTP :3000', kind: 'primary' },
    ['mc', 'vol', 'WAL 落盘'],
    ['mc', 'gw', 'host.docker.internal'],
    ['net', 'mc', '收紧边界'],
    ['std', 'gw', '直连本机'],
    ['img', 'mc', 'docker run']
  ]
});

// ---------- 04 dependency ----------
add('04-dependency', {
  type: 'dependency', dir: 'TB', title: '模块依赖（自上而下）', subtitle: '入口 → 界面/路由 → lib 内核 → 数据与执行接缝',
  caption: '依赖方向依据 src/ 目录 import 关系；箭头指向被依赖方。29 个运行时依赖里 next/better-sqlite3/node-pty 是三根支柱。',
  budget: 'faithful',
  nodes: [
    { id: 'panel', label: '[[...panel]]', sub: '单页 catch-all', row: 0, col: 0 },
    { id: 'rtapi', label: 'app/api', sub: '151 route.ts', row: 0, col: 2 },
    { id: 'cli', label: 'scripts/ 三入口', sub: 'MCP · CLI · TUI', kind: 'external', row: 0, col: 4 },
    { id: 'comp', label: 'components', sub: '90 组件', row: 1, col: 0 },
    { id: 'store', label: 'store', sub: 'Zustand 单仓', row: 1, col: 1 },
    { id: 'lib', label: 'src/lib', sub: '310 文件 · 4.6 万行', focal: true, row: 2, col: 1 },
    { id: 'sse', label: 'use-server-events', sub: 'SSE 消费', row: 1, col: 2 },
    { id: 'db', label: 'db.ts', sub: 'better-sqlite3', kind: 'store', row: 3, col: 0 },
    { id: 'gwlib', label: 'openclaw-gateway', sub: 'WS RPC', row: 3, col: 2 },
    { id: 'pty', label: 'pty-manager', sub: 'node-pty', row: 3, col: 3 }
  ],
  edges: [
    ['panel', 'comp'], ['comp', 'store'], ['store', 'sse'], ['sse', 'rtapi', 'EventSource'],
    ['rtapi', 'lib'], ['panel', 'lib'], ['cli', 'rtapi', 'REST'],
    { from: 'lib', to: 'db', kind: 'primary' }, { from: 'lib', to: 'gwlib', kind: 'primary' }, ['lib', 'pty']
  ]
});

// ---------- 05 architecture-delta ----------
add('05-architecture-delta', {
  type: 'architecture-delta', title: '架构增量：多租户与 agent-run 协议', subtitle: '从单人单机面板长出平台骨架',
  caption: '迁移 012/021/029 引入 tenants→workspaces 并把 workspace_id 扩散到约 20 张表；迁移 038/046 新增评测与运行事实表。',
  evidence: [{ id: 'm021', file: 'src/lib/migrations.ts', line: 590 }, { id: 'runs', file: 'src/lib/migrations.ts', line: 1329 }],
  nodes: [
    { id: 'base', label: '单机任务面板', sub: 'tasks/agents', change: 'changed', row: 1, col: 0 },
    { id: 'ws', label: 'tenants + workspaces', sub: '迁移 012/021', change: 'added', focal: true, row: 1, col: 1 },
    { id: 'iso', label: 'workspace 隔离', sub: 'fail-closed 强制', change: 'added', row: 2, col: 1 },
    { id: 'v1', label: '/api/v1 runs·evals', sub: 'agent-run 协议', change: 'added', row: 0, col: 2 },
    { id: 'mem', label: 'memory_fts', sub: 'FTS5 检索', change: 'added', row: 2, col: 2 },
    { id: 'super', label: 'Super Admin 面板', sub: '租户开户流水线', change: 'added', row: 0, col: 1 },
    { id: 'db', label: 'SQLite 48 表', kind: 'store', row: 1, col: 3 }
  ],
  edges: [
    { from: 'base', to: 'ws', label: '长出', change: 'added', kind: 'primary' },
    { from: 'ws', to: 'iso', change: 'added' },
    { from: 'ws', to: 'super', change: 'added' },
    { from: 'ws', to: 'v1', change: 'added' },
    ['base', 'mem', '检索增强'],
    { from: 'ws', to: 'db', label: '约 20 表加 workspace_id' },
    { from: 'v1', to: 'db', label: 'runs ≈40 列' },
    ['iso', 'db']
  ]
});

// ---------- 06 it-state ----------
add('06-it-state', {
  type: 'it-state', title: '子系统健康度', subtitle: 'alpha 软件的成熟度地图',
  caption: '状态为分析性判断：ok=有测试与迁移护航；risk=README 明示可能破坏性变更；legacy=附属工具。',
  budget: 'faithful',
  nodes: [
    { id: 'core', label: '任务派发管线', sub: '2247 行 · 89 个安全单测', status: 'ok', focal: true, row: 0, col: 1 },
    { id: 'api', label: 'API 契约', sub: '253 端点 · parity 门禁', status: 'ok', row: 0, col: 2 },
    { id: 'ui', label: '前端面板', sub: '36 面板 · 11 语言', status: 'ok', row: 1, col: 0 },
    { id: 'secp', label: '安全工程', sub: 'CSP/限速/设备身份', status: 'ok', row: 0, col: 0 },
    { id: 'gw', label: 'OpenClaw 对接', sub: '协议 v3 · 可选依赖', status: 'risk', row: 1, col: 1 },
    { id: 'rt', label: 'runtime 探测/安装', sub: '脚本下载 + AI 审计', status: 'risk', row: 1, col: 2 },
    { id: 'ops', label: 'ops 配置守护', sub: '多租户专用 · 384 行', status: 'legacy', row: 2, col: 0 },
    { id: 'alpha', label: '整体版本', sub: 'v2.3.0 · alpha 警示', status: 'risk', row: 2, col: 2 }
  ],
  edges: [
    ['core', 'api'], ['api', 'ui'], ['secp', 'api'], ['gw', 'core'], ['rt', 'gw'], ['ops', 'secp'], ['alpha', 'core']
  ]
});

// ---------- 07 uml-class ----------
add('07-uml-class', {
  type: 'uml-class', dir: 'TB', title: '核心接口：派发与适配', subtitle: '调度器、派发器、网关客户端与框架适配器',
  caption: '依据 src/lib/task-dispatch.ts、scheduler.ts、openclaw-gateway.ts、adapters/adapter.ts。',
  evidence: [{ id: 'ad', file: 'src/lib/adapters/adapter.ts', line: 60 }],
  nodes: [
    { id: 'sched', label: 'Scheduler', tag: '«60s tick»', methods: ['initScheduler()', 'tick()', 'triggerTask(id)'], row: 0, col: 0 },
    { id: 'disp', label: 'TaskDispatch', tag: '«2247 行»', focal: true, methods: ['autoRouteInboxTasks()', 'dispatchAssignedTasks()', 'runAegisReviews()', 'reconcile…()'], row: 1, col: 1 },
    { id: 'gw', label: 'GatewayClient', methods: ['callOpenClawGateway(method)', 'connect.challenge 握手'], row: 2, col: 2 },
    { id: 'adp', label: 'FrameworkAdapter', tag: '«interface»', methods: ['register()', 'heartbeat()', 'reportTask()', 'getAssignments()'], row: 2, col: 0 },
    { id: 'bus', label: 'EventBus', methods: ['broadcast(type, data)', "on('server-event')"], row: 1, col: 2 },
    { id: 'impl', label: '6 个适配器', tag: '六种框架', row: 3, col: 0 }
  ],
  edges: [
    ['sched', 'disp', '触发'],
    { from: 'disp', to: 'gw', label: 'WS RPC', kind: 'primary' },
    ['disp', 'bus', '状态广播'],
    ['adp', 'bus', '转事件'],
    ['impl', 'adp', '', 'implements'],
    ['disp', 'sched', '被调度']
  ]
});

// ---------- 08 er ----------
add('08-er', {
  type: 'er', title: '领域模型：租户到质检', subtitle: '显式外键少，workspace_id 逻辑隔离是主旋律',
  caption: '依据 src/lib/schema.sql 与 migrations.ts；tasks.assigned_to 按 agents.name 弱关联（非外键）。',
  evidence: [{ id: 'wk', file: 'src/lib/task-dispatch.ts', line: 1736 }],
  nodes: [
    { id: 'tenant', label: 'Tenant', fields: ['id PK', 'plan_tier', 'openclaw_home'], row: 0, col: 0 },
    { id: 'ws', label: 'Workspace', fields: ['id PK', 'tenant_id FK', 'isolation_mode'], focal: true, row: 0, col: 1 },
    { id: 'user', label: 'User', fields: ['id PK', 'role', 'password_hash'], row: 1, col: 0 },
    { id: 'task', label: 'Task', fields: ['id PK', 'workspace_id', 'status', 'assigned_to*', 'dispatch_attempts'], row: 1, col: 2 },
    { id: 'agent', label: 'Agent', fields: ['name*', 'workspace_id*', 'status', 'runtime_type'], row: 0, col: 3 },
    { id: 'cmt', label: 'Comment', fields: ['id PK', 'task_id FK'], row: 2, col: 2 },
    { id: 'qr', label: 'QualityReview', fields: ['id PK', 'task_id FK', 'verdict'], row: 2, col: 3 },
    { id: 'run', label: 'Run', fields: ['id PK', 'cost', 'signature', 'lineage'], row: 1, col: 3 }
  ],
  edges: [
    ['tenant', 'ws', '拥有', 'many-one'],
    ['ws', 'task', '隔离', 'many-one'],
    { from: 'task', to: 'cmt', label: '讨论', kind: 'primary' },
    { from: 'task', to: 'qr', label: 'Aegis 裁决', kind: 'primary' },
    { from: 'task', to: 'agent', label: '按名字弱关联', kind: 'primary' },
    ['user', 'task', '创建', 'many-one'],
    ['run', 'task', '执行事实', 'many-one']
  ]
});

// ---------- 09 db-schema ----------
add('09-db-schema', {
  type: 'db-schema', title: 'SQLite 真实表结构（节选）', subtitle: '48 张表里最核心的六张',
  caption: '来源 src/lib/schema.sql 与 migrations.ts（001/040/046/048）；better-sqlite3，WAL 模式，foreign_keys=ON。',
  evidence: [{ id: 'sc', file: 'src/lib/schema.sql', line: 5 }, { id: 'runs', file: 'src/lib/migrations.ts', line: 1329 }],
  nodes: [
    { id: 't', label: 'tasks', focal: true, fields: [['id', 'TEXT', 'PK'], ['title', 'TEXT', ''], ['status', 'TEXT', 'idx'], ['priority', 'TEXT', ''], ['assigned_to', 'TEXT', '→agents.name'], ['workspace_id', 'TEXT', 'idx'], ['dispatch_attempts', 'INTEGER', ''], ['metadata', 'JSON', '']] },
    { id: 'a', label: 'agents', fields: [['name', 'TEXT', 'PK*'], ['workspace_id', 'TEXT', 'UNIQUE'], ['status', 'TEXT', ''], ['runtime_type', 'TEXT', ''], ['config', 'JSON', '']] },
    { id: 'c', label: 'comments', fields: [['id', 'TEXT', 'PK'], ['task_id', 'TEXT', 'FK CASCADE'], ['author', 'TEXT', ''], ['parent_id', 'TEXT', 'FK self']] },
    { id: 'q', label: 'quality_reviews', fields: [['id', 'TEXT', 'PK'], ['task_id', 'TEXT', 'FK CASCADE'], ['verdict', 'TEXT', 'APPROVED/…']] },
    { id: 'r', label: 'runs', fields: [['id', 'TEXT', 'PK'], ['cost', 'REAL', ''], ['signature', 'BLOB', 'Ed25519'], ['lineage', 'JSON', ''], ['agent_id', 'TEXT', 'idx']] },
    { id: 'k', label: 'agent_api_keys', fields: [['key_hash', 'TEXT', 'mca_ 前缀'], ['agent_id', 'TEXT', 'FK'], ['scopes', 'JSON', '']] }
  ],
  edges: [
    ['c.task_id', 't.id', '', 'many-one'],
    { from: 'q.task_id', to: 't.id', label: 'Aegis', kind: 'primary' },
    ['k.agent_id', 'a.name', '', 'many-one'],
    ['r.agent_id', 'a.name', '', 'many-one'],
    ['t.assigned_to', 'a.name', '逻辑关联', 'many-one']
  ]
});

// ---------- 10 flowchart ----------
add('10-flowchart', {
  type: 'flowchart', title: '派发决策树', subtitle: '一条 assigned 任务的四条出路',
  caption: '依据 dispatchAssignedTasks 决策顺序（task-dispatch.ts:1820 起）：claude 会话优先，永不降级回退。',
  evidence: [{ id: 'dd', file: 'src/lib/task-dispatch.ts', line: 1820 }],
  nodes: [
    { id: 's', label: '取 3 条 assigned', shape: 'terminal', row: 0, col: 1 },
    { id: 'd1', label: 'runtime 是 claude？', shape: 'decision', row: 1, col: 1 },
    { id: 'n1', label: 'Claude 基础会话派发', sub: 'dispatchViaClaudeSession', row: 1, col: 0 },
    { id: 'd2', label: '有 target_session？', shape: 'decision', row: 2, col: 1 },
    { id: 'n2', label: '网关 chat.send 定向', row: 2, col: 0 },
    { id: 'd3', label: '直连可用？', shape: 'decision', row: 3, col: 1 },
    { id: 'n3', label: '按模型直连 API', sub: 'Opus/Haiku/Sonnet 分级', row: 3, col: 0 },
    { id: 'n4', label: '网关 agent 新会话', sub: '异步 runId', focal: true, row: 3, col: 2 },
    { id: 'e', label: 'attempts≥5 → failed，否则回 assigned', shape: 'terminal', row: 4, col: 1 }
  ],
  edges: [
    ['s', 'd1'],
    { from: 'd1', to: 'n1', label: '是', kind: 'primary' },
    { from: 'd1', to: 'd2', label: '否' },
    { from: 'd2', to: 'n2', label: '是', kind: 'primary' },
    { from: 'd2', to: 'd3', label: '否' },
    { from: 'd3', to: 'n3', label: '是', kind: 'primary' },
    { from: 'd3', to: 'n4', label: '否', kind: 'primary' },
    { from: 'n1', to: 'e', label: '失败' },
    { from: 'n4', to: 'e', label: '失败' }
  ]
});

// ---------- 11 sequence ----------
add('11-sequence', {
  type: 'sequence', title: '一次异步派发的时序', subtitle: '从 60s tick 到 Aegis 通过',
  caption: '依据 task-dispatch.ts 与 openclaw-gateway.ts：网关调用 fire-and-forget，靠 metadata.async_state 对账。',
  evidence: [{ id: 'rc', file: 'src/lib/task-dispatch.ts', line: 509 }],
  numbered: true,
  participants: [
    { id: 'sch', label: '调度器' },
    { id: 'disp', label: '派发器', kind: 'focal' },
    { id: 'db', label: 'SQLite' },
    { id: 'gw', label: 'OpenClaw 网关' },
    { id: 'ag', label: 'Agent 会话' },
    { id: 'ui', label: '面板 (SSE)', kind: 'external' }
  ],
  messages: [
    ['sch', 'disp', 'tick：task_dispatch 到期'],
    ['disp', 'db', 'UPDATE assigned→in_progress（原子抢占）'],
    ['disp', 'gw', 'WS connect.challenge 握手'],
    ['gw', 'ag', 'agent：新会话执行任务'],
    ['gw', 'disp', '返回 runId → metadata'],
    ['disp', 'ui', 'broadcast task.updated'],
    ['disp', 'gw', 'reconcile：agent.wait 轮询'],
    ['gw', 'ag', '等待运行结束'],
    ['ag', 'disp', '结果 → status=review'],
    ['disp', 'db', 'Aegis 裁决 APPROVED → done']
  ],
  fragments: [{ kind: 'loop', label: '60s 一次直到完成', from: 6, to: 8 }]
});

// ---------- 12 state ----------
add('12-state', {
  type: 'state', title: '任务状态机', subtitle: '九个状态、四处自动回退',
  caption: '依据 schema.sql:192 枚举与 task-dispatch.ts 各转换点；done 需 Aegis APPROVED 或人工豁免。',
  evidence: [{ id: 'qr', file: 'src/lib/task-dispatch.ts', line: 1541 }],
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'inbox', label: 'inbox', row: 0, col: 1 },
    { id: 'asg', label: 'assigned', row: 0, col: 2 },
    { id: 'prog', label: 'in_progress', focal: true, row: 0, col: 3 },
    { id: 'rev', label: 'review', row: 1, col: 3 },
    { id: 'qual', label: 'quality_review', row: 1, col: 2 },
    { id: 'done', shape: 'end', row: 1, col: 0 },
    { id: 'fail', label: 'failed', row: 2, col: 0 },
    { id: 'wait', label: 'awaiting_owner', row: 2, col: 3 }
  ],
  edges: [
    ['s', 'inbox', '创建'],
    { from: 'inbox', to: 'asg', label: '自动路由打分', kind: 'primary' },
    { from: 'asg', to: 'prog', label: '原子抢占', kind: 'primary' },
    { from: 'prog', to: 'rev', label: '结果回传', kind: 'primary' },
    { from: 'rev', to: 'qual', label: 'Aegis 接管' },
    { from: 'qual', to: 'done', label: 'APPROVED', kind: 'primary' },
    { from: 'qual', to: 'asg', label: '驳回 ≤3 次附反馈' },
    { from: 'qual', to: 'fail', label: '驳回 >3 次' },
    { from: 'prog', to: 'asg', label: 'stale 回收（离线 10min）' },
    { from: 'prog', to: 'wait', label: '等待所有者' },
    { from: 'asg', to: 'fail', label: 'attempts≥5' }
  ]
});

// ---------- 13 swimlane ----------
add('13-swimlane', {
  type: 'swimlane', title: '一次任务的全流程（跨职能）', subtitle: '操作者只碰两头，中间全自动',
  caption: '依据 api/tasks/route.ts、scheduler.ts、task-dispatch.ts 与 /api/sessions/[id]/control。',
  budget: 'faithful',
  lanes: [
    { id: 'op', label: '操作者' },
    { id: 'api', label: 'API/网关层' },
    { id: 'sch', label: '调度器' },
    { id: 'ag', label: 'Agent' },
    { id: 'ae', label: 'Aegis 质检' }
  ],
  nodes: [
    { id: 'create', label: '创建任务', lane: 'op', col: 0 },
    { id: 'valid', label: '校验落库+广播', lane: 'api', col: 1 },
    { id: 'route', label: '自动路由打分', lane: 'sch', col: 2 },
    { id: 'disp', label: '原子抢占派发', lane: 'sch', col: 3, focal: true },
    { id: 'exec', label: '会话执行', lane: 'ag', col: 4 },
    { id: 'back', label: '结果写回 review', lane: 'sch', col: 5 },
    { id: 'judge', label: '裁决 APPROVED/驳回', lane: 'ae', col: 6 },
    { id: 'notify', label: '收通知/看复盘', lane: 'op', col: 7 }
  ],
  edges: [
    ['create', 'valid'], ['valid', 'route'], { from: 'route', to: 'disp', kind: 'primary' },
    { from: 'disp', to: 'exec', kind: 'primary' }, ['exec', 'back'], ['back', 'judge'], ['judge', 'notify']
  ]
});

// ---------- 14 process ----------
add('14-process', {
  type: 'process', title: '五步跑起来', subtitle: '从克隆到第一次派发',
  caption: '依据 README「Start locally」与 install.sh（Node 22+ / pnpm）。',
  steps: [
    { label: '克隆并安装', sub: 'install.sh --local 或 Docker' },
    { label: '创建管理员', sub: '首次访问 /setup 向导' },
    { label: '接入运行时', sub: '检测/安装 OpenClaw、Claude Code' },
    { label: '建 Agent', sub: '角色 + soul 提示词 + 会话' },
    { label: '派发任务', sub: '面板或 mc CLI / MCP 工具' }
  ]
});

// ---------- 15 data-flow ----------
add('15-data-flow', {
  type: 'data-flow', title: '运行数据的数据流', subtitle: '一次产生，三路消费',
  caption: '会话事实存于网关侧 JSONL 文件；MC 只做镜像与聚合，token_usage 是计费真相源。',
  budget: 'faithful',
  evidence: [{ id: 'sess', file: 'src/lib/sessions.ts', line: 68 }, { id: 'tok', file: 'src/lib/migrations.ts', line: 493 }],
  nodes: [
    { id: 'jsonl', label: '网关 JSONL 转录', kind: 'input', row: 0, col: 0 },
    { id: 'scan', label: 'gateway_agent_sync', sub: '60s · 30s 缓存', row: 0, col: 1 },
    { id: 'db', label: 'SQLite', sub: 'agents/sessions/token_usage', kind: 'store', row: 1, col: 1 },
    { id: 'bus2', label: 'eventBus', sub: '24 种事件', row: 1, col: 2 },
    { id: 'sse', label: 'SSE /api/events', sub: 'workspace 过滤', row: 0, col: 2 },
    { id: 'st', label: 'Zustand store', row: 0, col: 3 },
    { id: 'wd', label: '15 种 widget', kind: 'external', focal: true, row: 1, col: 3 },
    { id: 'cost', label: '成本报表/导出', kind: 'external', row: 2, col: 2 }
  ],
  edges: [
    { from: 'jsonl', to: 'scan', label: '文件镜像', kind: 'primary' },
    ['scan', 'db', '状态回写'],
    ['db', 'bus2', '变更广播'],
    { from: 'bus2', to: 'sse', label: 'server-event', kind: 'primary' },
    ['sse', 'st', '指数退避重连'],
    ['st', 'wd'],
    ['db', 'cost', 'token 计量']
  ]
});

// ---------- 16 journey ----------
add('16-journey', {
  type: 'journey', title: '新操作者旅程', subtitle: '从克隆仓库到放心放手',
  caption: '情绪得分为分析性推断；步骤均对应仓库真实入口（README、/setup、panels/*）。',
  stages: [
    { label: '部署', steps: [{ label: 'docker compose up 或 install.sh', score: 1 }, { label: '健康检查通过', score: 1 }] },
    { label: '建号', steps: [{ label: '/setup 创建首个 admin', score: 0 }, { label: '自动生成的凭据入 .data', score: 0 }] },
    { label: '接入', steps: [{ label: '探测五个 runtime', score: 0 }, { label: '装 OpenClaw 网关 + token', score: -1 }] },
    { label: '派发', steps: [{ label: '写任务卡（角色/优先级）', score: 1 }, { label: '看它被自动路由、抢占、执行', score: 2 }] },
    { label: '观察', steps: [{ label: 'SSE 实时活动流 + PTY 终端', score: 2 }, { label: '成本与 token 报表', score: 1 }] },
    { label: '复盘', steps: [{ label: 'Aegis 驳回意见读一遍', score: -1 }, { label: '安全审计面板跑一遍', score: 1 }] }
  ]
});

// ---------- 17 timeline ----------
add('17-timeline', {
  type: 'timeline', title: '八个月 542 次提交', subtitle: '2026-02-23 首次提交至今',
  caption: CAP + '；提交数为 git log 按月统计。',
  events: [
    { date: '2026-02-23', label: '首次提交（Nyk）' },
    { date: '2026-03-31', label: '首月冲刺收尾：295 提交' },
    { date: '2026-06-30', label: '平台期：单月仅 2 提交' },
    { date: '2026-07-31', label: '二次冲刺：159 提交' },
    { date: '2026-10-28', label: 'v2.3.0 · 55 位贡献者' }
  ],
  periods: [
    { from: '2026-02', to: '2026-03', label: '起步冲刺（326 提交）' },
    { from: '2026-04', to: '2026-06', label: '平台期（42 提交）' },
    { from: '2026-07', to: '2026-07', label: '集中迭代' },
    { from: '2026-08', to: '2026-10', label: '维护收窄' }
  ]
});

// ---------- 18 gantt ----------
add('18-gantt', {
  type: 'gantt', title: '开发阶段甘特图', subtitle: '按月度提交强度划分四个阶段',
  caption: CAP + '；阶段边界为提交量拐点（2 月 31 → 3 月 295 → 6 月 2 → 7 月 159）。',
  today: '2026-11-01',
  tasks: [
    { id: 'a', label: '起步：面板与派发内核', section: '2026 上半年', start: '2026-02-23', end: '2026-03-31', done: true },
    { id: 'b', label: '安全体系与质量门禁', section: '2026 上半年', start: '2026-03-15', end: '2026-04-30', done: true },
    { id: 'c', label: '平台期修补', section: '2026 上半年', start: '2026-05-01', end: '2026-06-30', done: true },
    { id: 'd', label: '二次冲刺：多租户/评测', section: '2026 下半年', start: '2026-07-01', end: '2026-07-31', done: true },
    { id: 'e', label: '维护与 v2.3.0 收口', section: '2026 下半年', start: '2026-08-01', end: '2026-10-28', done: true }
  ],
  milestones: [
    { label: '首次提交', date: '2026-02-23' },
    { label: 'v2.3.0', date: '2026-10-28' }
  ]
});

// ---------- 19 kanban ----------
add('19-kanban', {
  type: 'kanban', title: '派发管线看板', subtitle: '每一列的自动规则与容量',
  caption: '列名为真实状态枚举；卡片内容为 task-dispatch.ts 中的自动规则（容量数字为代码常量）。',
  columns: [
    { label: 'inbox', cards: [{ label: '自动路由每轮取 5 条', tag: '打分' }, { label: '角色亲和 10 + 能力 15 + 空闲 5', tag: '打分' }] },
    { label: 'assigned', cards: [{ label: '每轮派发 3 条', tag: '批量' }, { label: '条件 UPDATE 原子抢占', tag: '防双派发' }] },
    { label: 'in_progress', cards: [{ label: '单 agent 并发上限 3', tag: '容量' }, { label: '离线 10 分钟被回收', tag: 'stale' }] },
    { label: 'review', cards: [{ label: 'Aegis 每 60s 取 3 条', tag: '质检' }, { label: '先置 quality_review 防重入', tag: '幂等' }] },
    { label: 'done', cards: [{ label: '需 APPROVED 才可进入', tag: '门槛' }, { label: '驳回 ≤3 次回 assigned', tag: '回路' }] }
  ]
});

// ---------- 20 story-map ----------
add('20-story-map', {
  type: 'story-map', title: '产品故事图', subtitle: '主干活动 × 发布切片',
  caption: '切片为分析性归纳：已发布=v2.3.0 可验证能力，演进中=alpha 阶段仍在变动的部分。',
  releases: ['已发布 v2.3.0', '演进中'],
  activities: [
    { label: '派发', focal: true, steps: [{ label: '任务 CRUD', stories: { '已发布 v2.3.0': ['面板/CLI/MCP 三入口'], '演进中': ['任务模板'] } }, { label: '自动路由', stories: { '已发布 v2.3.0': ['打分 + 原子抢占'], '演进中': ['协调员定向投递'] } }] },
    { label: '观察', steps: [{ label: '实时面板', stories: { '已发布 v2.3.0': ['SSE + 15 widget'], '演进中': ['截图漂移检查'] } }, { label: '终端', stories: { '已发布 v2.3.0': ['PTY 多窗格'], '演进中': ['执行审批叠加层'] } }] },
    { label: '质检', steps: [{ label: 'Aegis 评审', stories: { '已发布 v2.3.0': ['驳回回路 + 升级'], '演进中': ['评测排行榜'] } }] },
    { label: '治理', steps: [{ label: '成本', stories: { '已发布 v2.3.0': ['token 按域/agent 统计'], '演进中': ['预算硬上限'] } }, { label: '安全', stories: { '已发布 v2.3.0': ['审计三件套 + 限速'], '演进中': ['信任分联动'] } }] }
  ]
});

// ---------- 21 loop ----------
add('21-loop', {
  type: 'loop', title: '调度飞轮', subtitle: '60 秒一圈的自我强化循环',
  caption: '机制依据 scheduler.ts 的 12 个内建任务；每圈 tick 串联路由→派发→对账→质检→孵化。',
  center: '任务管线',
  centerSub: '60s tick',
  steps: [
    { label: '扫描 inbox', sub: 'autoRouteInboxTasks' },
    { label: '派发 3 条', sub: '原子抢占' },
    { label: '对账异步结果', sub: 'agent.wait' },
    { label: 'Aegis 质检', sub: '通过/驳回/失败' },
    { label: '孵化周期任务', sub: 'recurring spawn' }
  ]
});

// ---------- 22 medallion ----------
add('22-medallion', {
  type: 'medallion', title: '运行数据的分层加工', subtitle: '原始文件 → 结构化表 → 决策视图',
  caption: '层名为数据平台类比；物品均取自仓库真实组件（sessions.json、migrations 018/038、widgets）。',
  stages: [
    { label: '原始层', plain: true, kind: 'input', items: ['网关 JSONL 转录', 'cron/runs.json', 'audit_log 原始事件'] },
    { label: '结构层', items: ['agents/sessions 镜像', 'token_usage（018）', 'runs + eval_runs（038/046）'] },
    { label: '应用层', items: ['成本报表 / fleet 状态', 'eval 排行榜', '15 种仪表盘 widget'] }
  ]
});

// ---------- 23 dp-integration ----------
add('23-dp-integration', {
  type: 'dp-integration', title: '运行时数据集成', subtitle: '两个来源域汇入一个 SQLite + SSE 平台',
  caption: '依据 scheduler 的 gateway_agent_sync / claude_session_scan 与 /api/events。',
  evidence: [{ id: 'ev', file: 'src/app/api/events/route.ts', line: 12 }],
  stages: [
    { label: '来源', plain: true, kind: 'external', items: [{ id: 'oc', label: 'OpenClaw 网关' }, { id: 'cc', label: 'Claude Code 本地会话' }, { id: 'gh', label: 'GitHub 同步' }] },
    { label: '接入', items: [{ id: 'sync', label: '60s 扫描器' }, { id: 'sse2', label: 'eventBus' }] },
    { label: '平台', items: [{ id: 'sqlite', label: 'SQLite WAL' }, { id: 'idx', label: 'workspace 过滤' }] },
    { label: '消费', items: [{ id: 'push', label: 'SSE 推送' }, { id: 'api3', label: 'REST/v1 拉取' }, { id: 'exp', label: '导出/备份' }] }
  ],
  edges: [['oc', 'sync'], ['cc', 'sync'], ['gh', 'sync'], { from: 'sync', to: 'sqlite', kind: 'primary' }, ['sync', 'sse2'], ['sse2', 'sqlite'], ['sqlite', 'push'], ['sqlite', 'api3'], ['sqlite', 'exp'], { from: 'push', to: 'idx', kind: 'primary' }]
});

// ---------- 24 dp-security-matrix ----------
add('24-dp-security-matrix', {
  type: 'dp-security-matrix', title: '权限矩阵：谁能碰什么', subtitle: '四级角色 + agent 作用域 key',
  caption: '等级：none < read < write < admin；agent key 只能访问绑定 workspace 内自己的资源（fail-closed）。',
  rows: ['viewer', 'operator', 'admin', 'Super Admin', 'agent key (mca_)'],
  cols: ['任务', 'Agent 控制', '设置/凭据', '租户管理', '审计日志'],
  cells: [
    ['read', 'none', 'none', 'none', 'read'],
    ['write', 'read', 'none', 'none', 'read'],
    ['write', 'write', 'write', 'none', 'write'],
    ['admin', 'admin', 'admin', 'admin', 'admin'],
    ['write', 'read', 'none', 'none', 'none']
  ],
  focal: 'agent key (mca_)'
});

// ---------- 25 tree ----------
add('25-tree', {
  type: 'tree', title: '仓库目录结构', subtitle: '814 个跟踪文件的分布',
  caption: CAP + '；括号内为文件数。',
  budget: 'faithful',
  root: {
    label: 'mission-control/', children: [
      { label: 'src/', sub: '应用本体', children: [
        { label: 'lib/ (310)', sub: '内核：派发/网关/安全' },
        { label: 'app/ (163)', sub: '路由 + 151 个 API' },
        { label: 'components/ (90)', sub: '36 面板 + 16 widget' },
        { label: 'store/types/i18n', sub: 'Zustand + 领域类型' }
      ] },
      { label: 'tests/ (79)', sub: 'Playwright/集成 spec' },
      { label: 'scripts/ (15)', sub: 'MCP/CLI/TUI/部署' },
      { label: 'messages/ (11)', sub: '11 种语言文案' },
      { label: '.github/workflows (8)', sub: '质量与供应链门禁' },
      { label: 'ops/ (2)', sub: '租户配置守护' }
    ]
  }
});

// ---------- 26 org-chart ----------
add('26-org-chart', {
  type: 'org-chart', title: 'Agent 编队「组织架构」', subtitle: '把控制平面当成一家公司来看',
  caption: '人员无关；角色划分依据 coordinator-routing、task-dispatch 的 Aegis 与 agent 类型字段。',
  budget: 'faithful',
  root: {
    label: '操作者（你）', sub: '唯一信任锚', children: [
      { label: '协调员 Agent', sub: '收件箱路由中枢', children: [
        { label: 'Worker Agents', sub: 'main/subagent' },
        { label: 'Cron Agents', sub: '定时任务' },
        { label: 'Group Agents', sub: '多 agent 群聊' }
      ] },
      { label: 'Aegis 质检官', sub: 'APPROVED/REJECTED' },
      { label: 'OpenClaw 网关', sub: '基础设施 · 18789', children: [
        { label: '会话注册表', sub: 'sessions.json' }
      ] }
    ]
  }
});

// ---------- 27 nested ----------
add('27-nested', {
  type: 'nested', title: '信任域嵌套', subtitle: '从公网到一次 PTY 会话',
  caption: '边界为分析性描绘：依据 proxy.ts 的 matcher、enforcement/workspace-scope.ts 与 pty-websocket 鉴权。',
  budget: 'faithful',
  root: {
    label: '不可信网络', children: [
      { label: '反向代理 / Host 白名单', sub: 'MC_ALLOWED_HOSTS', children: [
        { label: 'Next 中间件 proxy.ts', sub: 'CSRF + CSP nonce', children: [
          { label: '角色授权', sub: 'viewer<operator<admin', children: [
            { label: 'workspace 边界', sub: '403 fail-closed', children: [
              { label: 'agent 作用域', sub: 'mca_ key 只见自己', children: [
                { label: 'PTY 会话', sub: '/ws/pty 鉴权升级' }
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
  type: 'layers', title: '纵深防御七层', subtitle: '一次请求要穿过的防线',
  caption: '全部为仓库真实机制：proxy.ts、auth.ts、rate-limit.ts（20 个限速器）、csp.ts、审计三件套。',
  layers: [
    { label: '边缘', sub: 'Host 白名单 / HSTS', items: ['MC_ALLOWED_HOSTS', 'CSRF Origin 校验'] },
    { label: '认证', sub: '三种凭据', items: ['__Host-mc-session', '全局 API key', 'agent key mca_'] },
    { label: '授权', sub: '角色层级', items: ['requireRole 401/403'] },
    { label: '隔离', sub: '多租户', items: ['workspace_id fail-closed', 'strict isolation 模式'] },
    { label: '限速', sub: '进程内 LRU', items: ['login 5/min', 'mutation 60/min …'] },
    { label: '内容安全', sub: 'CSP', items: ['nonce + strict-dynamic', 'frame-ancestors none'] },
    { label: '审计', sub: '事后追溯', items: ['security_events', 'agent_trust_scores', 'mcp_call_log（签名）'] }
  ]
});

// ---------- 29 isometric ----------
add('29-isometric', {
  type: 'isometric', title: '一台 Mission Control 工作站', subtitle: '把部署形态画成实物',
  caption: '示意：显示器=仪表盘，主机=Next.js standalone，深色小盒=SQLite 数据卷，侧挂外接盒=OpenClaw 网关。',
  parts: [
    { label: '桌面板', x: 0, y: 40, z: 0, w: 320, d: 200, h: 10, r: 4 },
    { label: '显示器（仪表盘）', x: 40, y: 0, z: 10, w: 180, d: 10, h: 110, r: 3, kind: 'screen' },
    { label: '显示器支架', x: 120, y: 20, z: 10, w: 14, d: 10, h: 40 },
    { label: '主机（standalone）', x: 60, y: 70, z: 10, w: 120, d: 70, h: 46, r: 4 },
    { label: 'SQLite 数据卷', sub: 'mc-data', x: 200, y: 120, z: 10, w: 60, d: 44, h: 26, kind: 'vault' },
    { label: 'OpenClaw 网关', sub: '宿主 18789', x: 250, y: 60, z: 10, w: 60, d: 44, h: 30, kind: 'terminal' },
    { label: '键盘（CLI/MCP）', x: 60, y: 160, z: 10, w: 110, d: 30, h: 6, r: 2 }
  ]
});

// ---------- 30 exploded ----------
add('30-exploded', {
  type: 'exploded', title: '拆开 standalone 产物', subtitle: 'deploy-standalone.sh 携带的全部家当',
  caption: '示意拆解：内容依据 scripts/prepare-standalone-artifact.mjs 的白名单与 check-standalone-artifact 边界检查。',
  parts: [
    { label: '部署外壳', sub: '.next/standalone', kind: 'housing', w: 190, d: 340, t: 16, r: 20 },
    { label: 'server.js 入口', sub: '含 /ws/pty 升级包装', w: 150, d: 60, t: 12 },
    { label: '.next 静态资源', sub: '页面 + messages', w: 150, d: 60, t: 12 },
    { label: '精简 node_modules', sub: '白名单依赖', w: 150, d: 60, t: 12 },
    { label: 'schema.sql', sub: '运行期唯一源文件', w: 150, d: 60, t: 10, kind: 'plate' },
    { label: 'node-pty 原生模块', sub: '单独补拷', w: 150, d: 60, t: 10, kind: 'chip' }
  ]
});

// ---------- 31 isometric-plan ----------
add('31-isometric-plan', {
  type: 'isometric-plan', title: '代码平面图', subtitle: '如果 src 是一个园区',
  caption: '面积为行数的示意比例；房间名=模块（行数来自 wc -l 统计）。',
  plate: { w: 960, d: 480 },
  rooms: [
    { label: 'lib 车间', sub: '内核 4.6 万行 · 310 文件', x: 20, y: 20, w: 300, d: 250, walls: true, door: 'S' },
    { label: 'components 展厅', sub: '4.3 万行 · 90 组件', x: 340, y: 20, w: 300, d: 200, walls: true, door: 'S' },
    { label: 'app 值班大厅', sub: '3.0 万行 · 151 个 API 窗口', x: 660, y: 20, w: 270, d: 220, walls: true, door: 'S' },
    { label: 'tests 演武场', sub: '8.1 千行 spec', x: 340, y: 240, w: 180, d: 130, walls: true, door: 'N' },
    { label: 'scripts 门房', sub: 'MCP/CLI/TUI 3.9 千行', x: 540, y: 240, w: 130, d: 130, walls: true, door: 'N' },
    { label: 'messages 翻译室', sub: '11 语言 · 2.4 万行', x: 690, y: 260, w: 240, d: 110, walls: true, door: 'W' }
  ],
  boxes: [
    { x: 60, y: 300, w: 70, d: 40, h: 14, kind: 'desk', label: '调度器' },
    { x: 160, y: 300, w: 70, d: 40, h: 14, kind: 'desk', label: '派发器' },
    { x: 260, y: 300, w: 50, d: 40, h: 14, kind: 'rack', label: '48 表' }
  ]
});

// ---------- 32 venn ----------
add('32-venn', {
  type: 'venn', title: '三种执行通道的重叠', subtitle: '同一个任务状态机的三张面孔',
  caption: '划分依据 dispatchAssignedTasks 的决策树与 pickProvider 的 provider 清单。',
  sets: [
    { id: 'gw', label: '网关通道', sub: 'WS RPC · 异步' },
    { id: 'api', label: 'API 直连', sub: 'anthropic/openai/minimax/local' },
    { id: 'cli', label: 'CLI 直连', sub: 'claude/codex 进程' }
  ],
  overlaps: [
    { sets: ['gw', 'api'], label: 'agent.wait 对账' },
    { sets: ['gw', 'cli'], label: '宿主机工具链' },
    { sets: ['api', 'cli'], label: '模型分级 Opus/Haiku/Sonnet' },
    { sets: ['gw', 'api', 'cli'], label: '统一状态机 + Aegis + 事件广播' }
  ]
});

// ---------- 33 pyramid ----------
add('33-pyramid', {
  type: 'pyramid', title: '任务优先级金字塔', subtitle: 'critical 永远先被派发',
  caption: '层级为 schema.sql 的 priority 枚举；派发按 critical→low 排序（task-dispatch.ts:1728）。',
  unit: '级',
  levels: [
    { label: 'critical', value: 1, sub: '最先抢占', focal: true },
    { label: 'high', value: 2 },
    { label: 'medium', value: 3, sub: '默认' },
    { label: 'low', value: 4 }
  ]
});

// ---------- 34 quadrant ----------
add('34-quadrant', {
  type: 'quadrant', title: '面板矩阵：使用频率 × 干预风险', subtitle: '36 个面板的导航心智图',
  caption: '位置为分析性判断，依据各面板操作的不可逆程度（执行审批/网关控制风险最高）。',
  x: { label: '使用频率', low: '低', high: '高' },
  y: { label: '干预风险', low: '低', high: '高' },
  quadrants: ['谨慎操作', '高频高危', '随用随查', '日常驾驶舱'],
  items: [
    { label: '任务看板', x: 0.9, y: 0.25, focal: true },
    { label: '实时活动流', x: 0.85, y: 0.1 },
    { label: '成本追踪', x: 0.6, y: 0.15 },
    { label: '终端 PTY', x: 0.65, y: 0.55 },
    { label: '安全审计', x: 0.3, y: 0.6 },
    { label: '网关控制', x: 0.25, y: 0.85 },
    { label: '执行审批', x: 0.7, y: 0.9 },
    { label: 'Super Admin', x: 0.12, y: 0.8 }
  ]
});

// ---------- 35 fishbone ----------
add('35-fishbone', {
  type: 'fishbone', title: '根因分析：任务为什么会派发失败', subtitle: 'task-dispatch 的五类已知失败面',
  caption: '原因为仓库可见事实的归纳：重试上限、预算上限与 stale 回收均写死在代码里。',
  effect: '派发失败 / 回退重试',
  categories: [
    { label: '网关', focal: true, causes: ['WS 18789 不可达', 'connect.challenge 失败', '旧协议方法降级'] },
    { label: '凭据', causes: ['agent key 无 scope', 'OAuth 凭据过期', 'gateway token 未配'] },
    { label: '预算', causes: ['CLI 预算上限 100 USD', 'attempts≥5 熔断'] },
    { label: '执行端', causes: ['agent 离线 10 分钟', '并发上限 3 占满', 'CLI 白名单拒绝工具'] }
  ]
});

// ---------- 36 wardley ----------
add('36-wardley', {
  type: 'wardley', title: 'Wardley 演进图', subtitle: 'Agent 编排的战略坐标',
  caption: '位置为分析性判断；evo 左=创世 右=商品化，vis 上=用户可见 下=基础设施。',
  components: [
    { id: 'need', label: '可靠地指挥 Agent 舰队', evo: 0.5, vis: 0.95, anchor: true },
    { id: 'panel', label: '控制面板', evo: 0.55, vis: 0.85, focal: true },
    { id: 'aegis', label: 'Aegis 自动质检', evo: 0.4, vis: 0.6 },
    { id: 'mcpgw', label: 'MCP 工具面', evo: 0.62, vis: 0.45 },
    { id: 'orch', label: '拉模式调度', evo: 0.45, vis: 0.35 },
    { id: 'gw2', label: 'OpenClaw 网关', evo: 0.35, vis: 0.25 },
    { id: 'llmapi', label: 'LLM API', evo: 0.8, vis: 0.2 },
    { id: 'next', label: 'Next.js / SQLite', evo: 0.9, vis: 0.08 }
  ],
  links: [['need', 'panel'], ['panel', 'aegis'], ['panel', 'mcpgw'], ['aegis', 'orch'], ['orch', 'gw2'], ['gw2', 'llmapi'], ['panel', 'next'], ['orch', 'llmapi']]
});

// ---------- 37 bar ----------
add('37-bar', {
  type: 'bar', orientation: 'horizontal', title: '各模块代码量', subtitle: 'wc -l 全量统计（含 ts/tsx/json/mjs/cjs）',
  caption: CAP + '；messages 为 11 种语言的翻译 JSON 行数。',
  unit: '千行',
  sort: 'desc',
  focal: 'src/lib',
  axis: '代码行数（千行）',
  data: [['src/lib', 46.3], ['src/components', 43.3], ['src/app', 29.7], ['messages/', 24.3], ['tests/', 8.1], ['scripts/', 3.9]]
});

// ---------- 38 line ----------
add('38-line', {
  type: 'line', title: '每月提交数', subtitle: '2026-02 至 2026-10（git log 按月）',
  caption: CAP + '；3 月与 7 月两次冲刺贡献全部提交的 84%。',
  unit: '提交',
  smooth: false,
  area: true,
  zero: false,
  x: ['02', '03', '04', '05', '06', '07', '08', '09', '10'],
  series: [{ name: '提交数', values: [31, 295, 22, 18, 2, 159, 9, 2, 4], focal: true }]
});

// ---------- 39 scatter ----------
add('39-scatter', {
  type: 'scatter', title: '各目录：文件数 × 代码量', subtitle: '一个点一个顶层目录',
  caption: CAP + '；lib 以 310 个文件承载最多逻辑，messages 用 11 个文件装下 2.4 万行文案。',
  xLabel: '文件数',
  yLabel: '代码行数（千行）',
  zero: false,
  points: [
    { label: 'src/lib', x: 310, y: 46.3, focal: true },
    { label: 'src/app', x: 163, y: 29.7 },
    { label: 'src/components', x: 90, y: 43.3 },
    { label: 'messages', x: 11, y: 24.3 },
    { label: 'tests', x: 79, y: 8.1 },
    { label: 'scripts', x: 15, y: 3.9 },
    { label: 'ops', x: 2, y: 0.4 }
  ]
});

// ---------- 40 waterfall ----------
add('40-waterfall', {
  type: 'waterfall', title: '12.9 万行是怎么堆出来的', subtitle: '按目录累加到总量',
  caption: CAP + '；不含锁文件与 openapi.json。',
  unit: '千行',
  steps: [['src/lib', 46.3], ['src/components', 43.3], ['src/app', 29.7], ['tests/', 8.1], ['store/types/i18n', 1.4]]
});

// ---------- 41 treemap ----------
add('41-treemap', {
  type: 'treemap', title: '253 个 API 端点的构成', subtitle: 'openapi.json 按 tag 统计',
  caption: '来源 openapi.json（v1.3.0，144 path / 253 operation），由 api:parity 门禁与路由双向对账。',
  unit: '端点',
  focal: 'Admin',
  data: [
    { label: '运维面', children: [['Admin', 69], ['Monitoring', 15], ['System/Config/Docs', 5]] },
    { label: 'Agent 面', children: [['Agents', 31], ['API/PTY', 29], ['Connections', 3]] },
    { label: '业务面', children: [['Projects', 14], ['Tasks', 13], ['Pipelines/Workflows', 10], ['Chat/Mentions', 6]] },
    { label: '平台面', children: [['Auth', 12], ['Sessions', 10], ['Super Admin', 10], ['Tokens/Quality/Releases', 7]] },
    { label: '扩展面', children: [['Webhooks', 8], ['Skills', 7], ['Alerts', 4]] }
  ]
});

// ---------- 42 heatmap ----------
add('42-heatmap', {
  type: 'heatmap', title: '提交热力图：星期 × 时段', subtitle: '542 次提交的作息（作者本地时区）',
  caption: CAP + '；周三 21-23 点一档 40 次，周四是绝对主力（179 次，33%）。',
  rows: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  cols: ['00-02', '03-05', '06-08', '09-11', '12-14', '15-17', '18-20', '21-23'],
  values: [
    [9, 3, 1, 10, 10, 3, 2, 8],
    [0, 0, 3, 2, 11, 7, 7, 8],
    [5, 1, 2, 6, 6, 16, 11, 40],
    [25, 11, 14, 16, 37, 30, 22, 24],
    [12, 0, 0, 7, 27, 8, 14, 6],
    [4, 4, 2, 7, 14, 22, 7, 26],
    [1, 3, 0, 0, 13, 11, 3, 1]
  ]
});

// ---------- 43 radar ----------
add('43-radar', {
  type: 'radar', title: '工程化画像', subtitle: '对照同体量开源项目的六维评估（1–5，分析性）',
  caption: '评分为依据仓库证据（8 个 CI 门禁、248 个测试文件、容器加固基线、11 语言）的相对判断。',
  axes: ['CI 深度', '测试密度', '容器加固', '供应链防护', '国际化', 'API 规范化'],
  max: 5,
  series: [
    { name: 'Mission Control', values: [5, 5, 5, 5, 5, 5], focal: true },
    { name: '同体量项目典型值', values: [3, 3, 2, 1, 2, 2] }
  ]
});

// ---------- 44 polar ----------
add('44-polar', {
  type: 'polar', title: '提交时刻的钟', subtitle: '24 小时分布（提交者本地时区）',
  caption: CAP + '；全天候作息 + 跨时区漂移（+0700 → +0100）。',
  center: '542 提交',
  focal: ['12', '23', '15'],
  data: [
    ['00', 29], ['01', 14], ['02', 14], ['03', 11], ['04', 7], ['05', 9],
    ['06', 2], ['07', 9], ['08', 10], ['09', 16], ['10', 11], ['11', 26],
    ['12', 48], ['13', 34], ['14', 39], ['15', 45], ['16', 32], ['17', 20],
    ['18', 22], ['19', 33], ['20', 17], ['21', 33], ['22', 39], ['23', 42]
  ]
});

// ---------- 45 sankey ----------
add('45-sankey', {
  type: 'sankey', title: '253 个端点去哪了', subtitle: '读 / 写 / 删 → 五大资源域',
  caption: '来源 openapi.json；域为 tag 归并（系统管理=Admin+System+Config 等）。',
  unit: '端点',
  links: [
    ['全部端点', '读 GET', 120], ['全部端点', '写 POST/PUT/PATCH', 111], ['全部端点', '删 DELETE', 22],
    ['读 GET', '系统管理', 36], ['读 GET', 'Agent 与运行时', 30], ['读 GET', '任务与项目', 16], ['读 GET', '观测与会话', 23], ['读 GET', '身份与租户', 9], ['读 GET', '扩展与告警', 6],
    ['写 POST/PUT/PATCH', '系统管理', 31], ['写 POST/PUT/PATCH', 'Agent 与运行时', 28], ['写 POST/PUT/PATCH', '任务与项目', 15], ['写 POST/PUT/PATCH', '观测与会话', 12], ['写 POST/PUT/PATCH', '身份与租户', 15], ['写 POST/PUT/PATCH', '扩展与告警', 10],
    ['删 DELETE', '系统管理', 5], ['删 DELETE', 'Agent 与运行时', 5], ['删 DELETE', '任务与项目', 6], ['删 DELETE', '观测与会话', 2], ['删 DELETE', '身份与租户', 1], ['删 DELETE', '扩展与告警', 3]
  ]
});

// ---------- 46 high-level-vertical ----------
add('46-high-level-vertical', {
  type: 'high-level-vertical', title: 'Mission Control 是什么（纵向）', subtitle: '窄幅布局，自上而下',
  caption: CAP,
  nodes: [
    { id: 'you', label: '你', kind: 'external', row: 0, col: 1 },
    { id: 'mc', label: 'Mission Control', sub: '本地控制平面', focal: true, row: 1, col: 1 },
    { id: 'dispatch', label: '自动派发', sub: '60s tick', row: 2, col: 0 },
    { id: 'watch', label: '实时观察', sub: 'SSE + 终端', row: 2, col: 1 },
    { id: 'audit', label: '质检与审计', sub: 'Aegis + 安全面板', row: 2, col: 2 },
    { id: 'fleet', label: 'Agent 舰队', sub: 'OpenClaw / Claude / Codex', row: 3, col: 1 }
  ],
  edges: [
    ['you', 'mc', '打开面板'],
    { from: 'mc', to: 'dispatch', kind: 'primary' },
    { from: 'mc', to: 'watch', kind: 'primary' },
    ['mc', 'audit'],
    { from: 'dispatch', to: 'fleet', label: '派任务', kind: 'primary' },
    ['fleet', 'watch', '回传状态']
  ]
});

// ---------- 47 sequence-oauth ----------
add('47-sequence-oauth', {
  type: 'sequence-oauth', title: '登录与会话校验', subtitle: '密码登录 → 哈希会话 → 边缘放行',
  caption: '依据 auth.ts、session-cookie.ts 与 proxy.ts：token 只存 SHA-256 哈希，有效期 7 天。',
  evidence: [{ id: 'ck', file: 'src/lib/session-cookie.ts', line: 59 }],
  participants: [
    { id: 'br', label: '浏览器', kind: 'external' },
    { id: 'mw', label: '中间件 proxy.ts' },
    { id: 'auth', label: 'auth.ts', kind: 'focal' },
    { id: 'db3', label: 'SQLite' }
  ],
  messages: [
    ['br', 'mw', 'POST /api/auth/login'],
    ['mw', 'auth', '放行（免认证名单）'],
    ['auth', 'auth', 'loginLimiter 5/min + scrypt 校验'],
    ['auth', 'db3', 'createSession：只存 SHA-256 哈希'],
    ['auth', 'br', '__Host-mc-session（7 天，httpOnly）'],
    ['br', 'mw', '后续请求带 cookie'],
    ['mw', 'db3', '形状校验 → 路由层查哈希比对']
  ],
  fragments: [{ kind: 'opt', label: '7 天过期 → 重新登录', from: 5, to: 6 }]
});

// ---------- 48 state-lifecycle ----------
add('48-state-lifecycle', {
  type: 'state-lifecycle', title: '网关会话生命周期', subtitle: 'MC 侧镜像文件的活跃度推导',
  caption: '依据 sessions.ts：active=60 分钟内有更新，live 状态 5 分钟内 active / 1 小时内 idle；控制操作仅 monitor/pause/terminate。',
  evidence: [{ id: 'ss', file: 'src/lib/sessions.ts', line: 176 }],
  nodes: [
    { id: 's', shape: 'start', row: 0, col: 0 },
    { id: 'spawn', label: 'spawn', sub: 'sessions_spawn', row: 0, col: 1 },
    { id: 'act', label: 'active', sub: '≤60min 有更新', focal: true, row: 0, col: 2 },
    { id: 'idle', label: 'idle', sub: '≤1h 前', row: 1, col: 2 },
    { id: 'off', label: 'offline', sub: '镜像仅存档', row: 1, col: 1 },
    { id: 'term', shape: 'end', sub: 'sessions_kill', row: 1, col: 0 }
  ],
  edges: [
    ['s', 'spawn'],
    { from: 'spawn', to: 'act', kind: 'primary' },
    { from: 'act', to: 'idle', label: '静默', kind: 'primary' },
    { from: 'idle', to: 'act', label: '新消息' },
    { from: 'idle', to: 'off', label: '超 1 小时' },
    { from: 'act', to: 'term', label: 'terminate' },
    { from: 'off', to: 'term', label: 'prune 清理' }
  ]
});

// ---------- 49 funnel ----------
add('49-funnel', {
  type: 'funnel', title: '单轮调度容量漏斗', subtitle: '每 60 秒 tick 的真实批量常量',
  caption: '数值为代码常量：autoRoute 每轮 5 条、派发与 Aegis 各 3 条；容量是为单人单机设计的保守节流。',
  levels: [
    { label: 'inbox 扫描', value: 5 },
    { label: '本轮派发', value: 3 },
    { label: '并发执行', value: 3 },
    { label: 'Aegis 抽检', value: 3 },
    { label: 'APPROVED 落账', value: 1, sub: '门槛制' }
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
