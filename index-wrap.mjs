/**
 * index-wrap.mjs — 在不改动服务代码的前提下，为记忆写入自动补充向量
 *
 * 原理：启动时劫持 fs.writeFileSync，监听对 memories.json 的写入，
 *       自动比对新增/变更/删除的记忆，同步更新向量索引。
 *
 * 用法：用 pm2 或 node 启动本文件，替代直接启动 mcp-memory-server.js
 *   node index-wrap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, 'memories.json');

const { upsertVector, deleteVector } = await import('./store.mjs');

const _writeFileSync = fs.writeFileSync;

// 内存中记录已索引的 id → content，用于比对变更
let lastKnown = new Map();
try {
  const cur = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  cur.forEach(m => lastKnown.set(String(m.id), m.content));
} catch {}

fs.writeFileSync = function (file, data, ...rest) {
  const result = _writeFileSync.call(this, file, data, ...rest);
  try {
    if (String(file).includes('memories.json') && typeof data === 'string') {
      const list = JSON.parse(data);

      // 新增或内容变更
      const changed = [];
      for (const m of list) {
        const id = String(m.id);
        if (!lastKnown.has(id) || lastKnown.get(id) !== m.content) {
          changed.push(m);
          lastKnown.set(id, m.content);
        }
      }

      // 删除
      const nowIds = new Set(list.map(m => String(m.id)));
      const removed = [...lastKnown.keys()].filter(id => !nowIds.has(id));
      for (const id of removed) {
        deleteVector(id);
        lastKnown.delete(id);
      }

      // 异步补向量（不阻塞写入）
      for (const m of changed) {
        upsertVector(m).catch(e => console.error('[wrap] 向量化失败:', e.message));
      }
      if (changed.length) console.log(`[wrap] 已为 ${changed.length} 条记忆补向量`);
    }
  } catch (e) {
    console.error('[wrap] 劫持处理出错（不影响原逻辑）:', e.message);
  }
  return result;
};

console.log('[wrap] 启动原 mcp-memory-server.js ...');
await import('./mcp-memory-server.js');
