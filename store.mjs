/**
 * store.mjs — 记忆存储 + 向量语义检索 + 混合召回 + 呼吸
 *
 * 设计要点：
 *  - memories.json 为唯一真相源（source of truth）
 *  - memory-vec.db 为可随时重建的向量索引
 *  - 检索采用 三路召回（向量 / 字面 / 标签）+ RRF 融合，规避单一向量在低区分度下的噪声
 *  - 向量化文本策略：取 content 前 120 字 + entities，避免长文本稀释语义信号
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { pipeline } from '@xenova/transformers';

// 数据目录：默认脚本所在目录。如需自定义，改这一行即可。
const DIR = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(DIR, 'memories.json');
const DB_PATH = path.join(DIR, 'memory-vec.db');
const DIM = 512; // bge-small-zh-v1.5 输出维度

const db = new Database(DB_PATH);
sqliteVec.load(db);
db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
  memory_id TEXT PRIMARY KEY, embedding FLOAT[${DIM}]
);`);

// ---------- embedding ----------
let _embedder = null;
export async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5');
  }
  return _embedder;
}
export async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

// ---------- 读写（原子写）----------
export function loadMemories() {
  try {
    if (!fs.existsSync(JSON_PATH)) return [];
    const raw = fs.readFileSync(JSON_PATH, 'utf8').trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
export function saveMemories(list) {
  const tmp = JSON_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, JSON_PATH);
}

// ---------- 向量索引 ----------
function embedTextOf(m) {
  const head = (m.content || m.summary || '').slice(0, 120);
  return [head, ...(m.entities || [])].join(' ');
}
export async function upsertVector(m) {
  const vec = await embed(embedTextOf(m));
  db.prepare(`INSERT OR REPLACE INTO vec_memories(memory_id, embedding) VALUES (?, ?)`)
    .run(String(m.id), new Float32Array(vec));
}
export function deleteVector(id) {
  db.prepare(`DELETE FROM vec_memories WHERE memory_id = ?`).run(String(id));
}
export function clearVectors() {
  db.prepare(`DELETE FROM vec_memories`).run();
}

// ---------- 余弦相似度 ----------
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---------- 混合检索 ----------
export async function searchMemory(query, { k = 5 } = {}) {
  const all = loadMemories();
  const byId = new Map(all.map(m => [String(m.id), m]));
  const q = (query || '').trim();
  if (!q) return [];

  // 路1：向量召回
  const qv = await embed(q);
  const rows = db.prepare(`SELECT memory_id, embedding FROM vec_memories`).all();
  const vecRanked = rows
    .map(r => {
      const buf = r.embedding;
      const v = Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
      return { id: String(r.memory_id), cos: cosine(qv, v) };
    })
    .sort((a, b) => b.cos - a.cos)
    .slice(0, 20)
    .map(x => x.id);

  // 路2：字面召回（多关键词，空格分隔）
  const kws = q.toLowerCase().split(/\s+/).filter(Boolean);
  const litRanked = all
    .map(m => {
      const c = (m.content || '').toLowerCase();
      const tg = (m.tags || []).join(' ').toLowerCase();
      let hit = 0;
      for (const k of kws) { if (c.includes(k)) hit++; else if (tg.includes(k)) hit += 0.6; }
      return { id: String(m.id), s: hit / kws.length };
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.id);

  // 路3：标签精确召回
  const tagRanked = all
    .filter(m => (m.tags || []).some(t => q.includes(t) || t.includes(q)))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map(m => String(m.id));

  // RRF 融合（只看排名，规避绝对分数噪声）
  const RRF_K = 60;
  const score = new Map();
  const add = (ids, w) => ids.forEach((id, i) => {
    score.set(id, (score.get(id) || 0) + w / (RRF_K + i + 1));
  });
  add(vecRanked, 1.0);
  add(litRanked, 1.2);
  add(tagRanked, 1.5);

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id]) => byId.get(id))
    .filter(Boolean);
}

// ---------- 呼吸 ----------
const NOISE_TAGS = ['技术', '记忆库', 'GitHub', 'iMessage', 'MCP', '开发', '技术进展', '花园'];

function _tagOverlap(a, b) {
  const ta = new Set((a.tags || []).map(t => t.toLowerCase()));
  return (b.tags || []).some(t => ta.has(t.toLowerCase()));
}

/**
 * 呼吸：新对话开始时自动浮现核心记忆。
 * fact（画像）全量 + state（状态）全量 + event（近期）按时间倒序、话题去重。
 */
export function breath({ recentK = 3, maxTotal = 14 } = {}) {
  const all = loadMemories();
  const facts  = all.filter(m => m.type === 'fact');
  const states = all.filter(m => m.type === 'state');

  const isNoise = m => (m.tags || []).some(t => NOISE_TAGS.includes(t));
  const sorted = all
    .filter(m => m.type === 'event' && !isNoise(m))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const recent = [];
  for (const m of sorted) {
    if (recent.length >= recentK) break;
    if (recent.some(r => _tagOverlap(r, m))) continue;
    recent.push(m);
  }

  const seen = new Set();
  const merged = [];
  for (const m of [...facts, ...states, ...recent]) {
    const id = String(m.id);
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(m);
  }
  return merged.slice(0, maxTotal);
}
