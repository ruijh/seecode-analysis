// 语音旁白生成：docs/demo.html 字幕时间轴 → 精炼口播稿 → MiniMax T2A 合成 → 注回 docs/demo.html
// 用法：
//   node tools/gen-narration.mjs --synthetic          # 离线自测：正弦 WAV 占位，验证注入与调度
//   node tools/gen-narration.mjs                      # 正式：调 MiniMax 合成全部 70 条并注入
//   node tools/gen-narration.mjs --voice male-qn-jingying --model speech-02-hd
//   node tools/gen-narration.mjs --plan               # 只打印计划，不调用不注入
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const SYNTHETIC = args.includes('--synthetic');
const PLAN_ONLY = args.includes('--plan');
const getArg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')) + '/..';
const DEMO = path.join(ROOT, 'docs/demo.html');
const CACHE = path.join(ROOT, 'tools/narration-cache');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'narration-plan.json'), 'utf8'));

/* ---------- 口播稿：字幕 → 精炼语音（目标 ≤ gap×3.9 字；key = 绝对秒） ---------- */
const SAY = {
  0.3: '给仓库发条消息，Issue、评论、群里都行。',
  4: '被允许的请求，它接单开工。',
  7.6: '交付 PR，结果回到你原来的对话。',
  10.6: '这就是那个超级代理。',
  12.3: 'GitHub 和飞书，两个消息源。',
  15.2: 'Engine 五个部件，经端口相连。',
  18.2: '状态全在 SQLite，全部 JSON 文档。',
  21.2: '主会话评估路由，worker 按单派活。',
  24: 'Outbox 幂等外发，回到原对话。',
  26.7: '不改宿主一行代码。',
  28.2: '一份 patch 文件，插进宿主。',
  30.8: 'GitHub 上线，飞书默认先关。',
  33.2: '两个 agent 预设，一并注册。',
  36.3: '一个 tmux 会话。',
  37.9: '无 Docker，无 systemd。',
  40.1: 'sqlite 和 worktrees 都在 stateDir。',
  42.5: '子进程管轮询，退出码有巡检。',
  45.9: '面板与编排的规模。',
  48: 'core 零外部依赖。',
  50.4: '第三方依赖只有两个。',
  52.8: '其余 24 个，全是 peer 包。',
  55.2: 'tests 六十五个文件，侧挂在旁。',
  57.9: '不是每条消息都有回应。',
  60.2: '去重、订阅、评估，五道闸。',
  63.4: '名单外的人艾特它，默认被无视。',
  67.2: '显式规则放行的消息，才变成 Trigger 事件。',
  72.3: '白名单直通，不经 LLM。',
  74.8: '其余的，只有 auto 能放行。',
  77.4: 'observe 先行，只记录不放行。',
  80.2: '拒绝也会记下原因，只是不回复。',
  84.3: '工单宏观只有两个状态。',
  86.9: '终态五值，可被追问唤醒。',
  89.7: 'wake 一触发，工单当场复活。',
  92.5: '复用原 Mandate，重新校验再执行。',
  96.3: '一个主脑，按单雇工。',
  98.2: '常驻主脑，评估路由。',
  100.4: 'worker 按单雇、随单退役。',
  102.8: 'worktree 隔离，后台 30 分钟强制上限。',
  108.3: '授权策略，不是定死的。',
  110.2: 'observe 模式，只记录。',
  112.6: '复盘、调规则、再放行。',
  115.2: '一个飞轮转下来，误伤越来越少。',
  120.3: '状态只有一个文件。',
  122.2: '九张表，全是 JSON 文档。',
  124.6: 'WAL 全同步，单写者事务。',
  127.2: 'Effects 是持久队列，Passes 每 2 秒泵一次。',
  132.3: '谁能碰什么？',
  134.6: 'worker 的读，只限本工单。',
  137: '凭据一列，几乎全员 none。',
  139.4: '面板读者就是同源运营者，可读可写设置。',
  144.3: '全项目 3.3 万行。',
  146.2: '源码测试，几乎一比一。',
  148.8: '编排最大，内核两千行。',
  151.6: '提示词 438 行，15 个部件可版本化。',
  156.3: '测试目录 65 个文件。',
  158.4: '和源码几乎 1:1。',
  160.8: '连文档一致性都校验。',
  163: '改实现不改文档，测试直接红。',
  165.9: '提示词效力，分五级。',
  168: '越靠近事实，效力越高。',
  170.4: '工具事实，压过一切。',
  173: 'policy 段随每次模型请求，重新生成。',
  177.9: '结构、流程、数据等五个维度。',
  180.6: '五个维度，四十九张图。',
  183.2: '每张都是可交互 HTML，悬停可回放。',
  186.6: '在线目录地址，见视频结尾。',
  192.8: '四个关键发现，贯穿全片。',
  196.4: '两态工单、保守准入、双会话、测试即规格。',
  200.8: '四十九张图，都能交互回放。',
  204: 'SeeCode，把仓库读成一张图。',
};
const normalize = s => s
  .replace(/→/g, '，').replace(/——/g, '，').replace(/ · /g, '、').replace(/ \/ /g, '、')
  .replace(/@/g, '艾特').replace(/≈/g, '约').replace(/1:1/g, '一比一')
  .replace(/\s+/g, ' ').trim();

/* ---------- MiniMax ---------- */
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.zcode/minimax.json'), 'utf8'));
const BASE = cfg.baseUrl || 'https://api.minimaxi.com';
const KEY = cfg.apiKey;
const MODEL = getArg('model', (cfg.tts && cfg.tts.defaultModel) || 'speech-02-turbo');
const VOICE = getArg('voice', (cfg.tts && cfg.tts.defaultVoice) || 'presenter_female');
const t2a = async (text, speed) => {
  let lastErr = null;
  for (let k = 0; k < 3; k++) {
    try {
      const res = await fetch(BASE + '/v1/t2a_v2', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL, text, stream: false,
          voice_setting: { voice_id: VOICE, speed, vol: 1.0, pitch: 0 },
          audio_setting: { sample_rate: 32000, bitrate: 64000, format: 'mp3', channel: 1 },
        }),
      });
      const j = await res.json();
      if (j.base_resp && j.base_resp.status_code !== 0) throw new Error('API ' + j.base_resp.status_code + ': ' + j.base_resp.status_msg);
      if (!j.data || !j.data.audio) throw new Error('no audio in response');
      return { mp3: Buffer.from(j.data.audio, 'hex'), dur: (j.extra_info && j.extra_info.audio_duration) || null };
    } catch (e) {
      lastErr = e;
      if (/1002|rate/i.test(String(e))) throw e; // 限流交给外层长退避
      await new Promise(r => setTimeout(r, 600 * (k + 1)));
    }
  }
  throw lastErr;
};

/* ---------- synthetic 占位（离线验证调度链路） ---------- */
const wavBeep = (sec, freq) => {
  const rate = 22050, n = Math.floor(rate * sec);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / 800, (n - i) / 800);
    buf.writeInt16LE(Math.round(Math.sin(2 * Math.PI * freq * i / rate) * env * 9000), 44 + i * 2);
  }
  return buf;
};

/* ---------- 主流程（支持断点续跑：cache 里 say 一致的条目直接复用） ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const items = plan.lines.map(l => ({
  t: l.abs, slot: l.gap * 0.94, text: l.text,
  say: SAY[l.abs] || normalize(l.text),
}));
if (PLAN_ONLY) {
  for (const it of items) console.log(String(it.t).padStart(7), 'gap', it.slot.toFixed(2), it.say);
  console.log('items:', items.length); process.exit(0);
}
fs.mkdirSync(CACHE, { recursive: true });
const idxPath = path.join(CACHE, 'index.json');
const prev = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : [];
const byT = new Map(prev.map(e => [e.t, e]));
const out = [];
let gen = 0;
const failed = [];
const realDur = buf => +(buf.length * 8 / 64000).toFixed(2); // CBR 64kbps MP3 → 秒
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  const ext = SYNTHETIC ? 'wav' : 'mp3';
  const mime = SYNTHETIC ? 'audio/wav' : 'audio/mpeg';
  let speed = 1.0, dur = 0, data = null;
  const cached = !SYNTHETIC && byT.get(it.t);
  if (cached && cached.say === it.say && fs.existsSync(path.join(CACHE, cached.file))) {
    data = fs.readFileSync(path.join(CACHE, cached.file));
    dur = realDur(data); speed = cached.speed || 1.0;
    // 语速回归自然区间：按真实时长重算理想速度（槽位留 8% 余量），偏差 ≥0.14 或超槽才重合成
    const ideal = Math.max(1.0, Math.min(1.5, Math.round(speed * dur / (it.slot * 0.92) * 100) / 100));
    if ((dur > it.slot && speed < 1.49) || speed - ideal >= 0.14) {
      speed = ideal;
      data = null;
      console.log(`[${i + 1}/${items.length}] t=${it.t} 重合成 spd=${speed}（原缓存 ${dur}s / 槽 ${it.slot.toFixed(2)}s）`);
    } else {
      console.log(`[${i + 1}/${items.length}] t=${it.t} 复用缓存 ${cached.file} (${dur}s / 槽 ${it.slot.toFixed(2)}s)`);
    }
  }
  if (!data) {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (SYNTHETIC) {
          const d = Math.min(it.slot * 0.8, 2.2);
          data = wavBeep(d, 300 + (i % 7) * 60); dur = d;
        } else {
          await sleep(4000); // RPM 节流
          process.stdout.write(`[${i + 1}/${items.length}] t=${it.t} spd=${speed} "${it.say.slice(0, 18)}" … `);
          const r = await t2a(it.say, speed); gen++;
          data = r.mp3; dur = realDur(data);
          console.log(dur.toFixed(2) + 's');
        }
        if (dur <= it.slot || SYNTHETIC) break;
        const next = Math.min(1.5, Math.round(speed * dur / it.slot * 100) / 100);
        if (next <= speed + 0.01) break;
        speed = next;
      }
    } catch (e) {
      console.log('FAILED: ' + e.message);
      if (/1002|rate/i.test(e.message)) { await sleep(20000); try { const r = await t2a(it.say, speed); gen++; data = r.mp3; dur = realDur(data); console.log('  退避后重试成功 ' + dur.toFixed(2) + 's'); } catch (e2) { console.log('  退避后仍失败: ' + e2.message); } }
      if (!data) failed.push({ t: it.t, say: it.say, err: e.message });
    }
  }
  if (!data) continue;
  const file = path.join(CACHE, String(i).padStart(2, '0') + '.' + ext);
  fs.writeFileSync(file, data);
  out.push({ t: it.t, d: dur, slot: +it.slot.toFixed(2), speed, say: it.say, text: it.text, file: path.basename(file), a: 'data:' + mime + ';base64,' + data.toString('base64') });
  fs.writeFileSync(idxPath, JSON.stringify(out.map(({ a, ...r }) => r), null, 1)); // 每条落盘，崩溃可续
}
fs.writeFileSync(path.join(CACHE, 'index.json'), JSON.stringify(out.map(({ a, ...r }) => r), null, 1));

/* ---------- 注入 docs/demo.html ---------- */
const line = 'const NARR=[' + out.map(o => `{t:${o.t},d:${o.d},a:'${o.a}'}`).join(',') + '];';
let html = fs.readFileSync(DEMO, 'utf8');
if (!/^const NARR=.*$/m.test(html)) { console.error('NARR marker not found'); process.exit(1); }
html = html.replace(/^const NARR=.*$/m, () => line);
fs.writeFileSync(DEMO, html);
const sizeMB = (fs.statSync(DEMO).size / 1048576).toFixed(2);
const over = out.filter(o => o.d > o.slot);
console.log(`\n注入完成：${out.length}/${items.length} 条（合成调用 ${gen} 次）→ docs/demo.html ${sizeMB}MB`);
if (failed.length) console.log('失败清单：\n' + failed.map(f => `  t=${f.t} "${f.say}" → ${f.err}`).join('\n'));
console.log(over.length ? `超时未完全适配 ${over.length} 条：` + over.map(o => o.t).join(',') : '全部旁白均落在各自时间槽内 ✓');
