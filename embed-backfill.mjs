/**
 * embed-backfill.mjs — 把 memories.json 全量向量化写入 memory-vec.db
 *
 * 设计要点：
 *  - 索引可随时重建，所以每次回填先 DROP 再 CREATE，保证幂等、避免主键冲突
 *  - 向量化文本 = content 前 120 字 + entities（不用 tags，避免噪声）
 *  - 首次运行会下载 bge-small-zh-v1.5 模型（约 100MB）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { pipeline } from '@xenova/transformers';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(DIR, 'memories.json');
const DB_PATH = path.join(DIR, 'memory-vec.db');
const DIM = 512;

if (!fs.existsSync(JSON_PATH)) {
  console.error(`❌ 找不到 ${JSON_PATH}`);
  console.error('   请先复制示例数据：cp memories.example.json memories.json');
  process.exit(1);
}

const db = new Database(DB_PATH);
sqliteVec.load(db);

// 索引可重建：先清空
db.exec(`DROP TABLE IF EXISTS vec_memories;`);
db.exec(`CREATE VIRTUAL TABLE vec_memories USING vec0(
  memory_id TEXT PRIMARY KEY, embedding FLOAT[${DIM}]
);`);

console.log('加载嵌入模型（首次会下载，请耐心等待）...');
const embedder = await pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5');

const memories = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const insert = db.prepare(`INSERT INTO vec_memories(memory_id, embedding) VALUES (?, ?)`);

let n = 0;
const seen = new Set();
for (const m of memories) {
  const id = String(m.id);
  if (seen.has(id)) { console.log('跳过重复 id:', id); continue; }
  seen.add(id);

  const head = (m.content || m.summary || '').slice(0, 120);
  const text = [head, ...(m.entities || [])].join(' ');
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  insert.run(id, new Float32Array(out.data));
  n++;
  if (n % 10 === 0) console.log(`已处理 ${n}/${memories.length}`);
}

console.log(`✅ 回填完成：${n} 条，索引库：${DB_PATH}`);
