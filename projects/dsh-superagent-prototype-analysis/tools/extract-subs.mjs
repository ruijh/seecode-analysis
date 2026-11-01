// 从 docs/demo.html 提取全部场景字幕：绝对时间、可用时长（到下一条旁白为止）、字符数
import fs from 'node:fs';
const src = fs.readFileSync('docs/demo.html', 'utf8');
const BAR = 2.4;
const opens = [...src.matchAll(/(?:^|[^.\w])(?:S|winScene)\(\{/g)].map(m => m.index);
let bars = 0;
const lines = [];
for (let i = 0; i < opens.length; i++) {
  const seg = src.slice(opens[i], i + 1 < opens.length ? opens[i + 1] : src.length);
  // 场景体到 draw(...)/anim(...) 内部就不再含 music/subs 定义，截断到第一个 music 或 subs 之后即可
  const mm = seg.match(/music:\[([\s\S]*?)\]\s*,\s*\n/);
  const n = mm ? (mm[1].match(/\['/g) || []).length : 0;
  const sm = seg.match(/subs:\[([\s\S]*?)\]\s*,\s*\n\s*sfx/);
  if (!mm || !sm || !n) continue;
  const start = bars * BAR; bars += n;
  const subs = [...sm[1].matchAll(/\{at:([0-9.]+),text:'((?:[^'\\]|\\.)*)'\}/g)]
    .map(x => ({ at: +x[1], text: x[2].replace(/\\n/g, '\n').replace(/\\'/g, "'") }));
  const dur = n * BAR;
  subs.forEach((s, k) => {
    const end = k < subs.length - 1 ? subs[k + 1].at : dur;
    lines.push({ start: +start.toFixed(2), at: s.at, abs: +(start + s.at).toFixed(2), text: s.text });
  });
}
lines.sort((a, b) => a.abs - b.abs);
lines.forEach((l, i) => {
  const nextAbs = i < lines.length - 1 ? lines[i + 1].abs : bars * BAR;
  l.gap = +(nextAbs - l.abs).toFixed(2);
  l.chars = [...l.text].length;
});
console.log('DUR =', bars * BAR, ' lines =', lines.length, ' totalChars =', lines.reduce((a, b) => a + b.chars, 0));
fs.writeFileSync('narration-plan.json', JSON.stringify({ dur: +(bars * BAR).toFixed(2), lines }, null, 1));
for (const l of lines) console.log(String(l.abs).padStart(7), 'gap', String(l.gap).padStart(5), String(l.chars).padStart(3) + '字', l.text.replace(/\n/g, ' ').slice(0, 44));
