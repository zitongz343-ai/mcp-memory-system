import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3004;
const MEMORY_FILE = path.join(__dirname, "memories.json");
const TMP_FILE = MEMORY_FILE + ".tmp";

app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

function readMemories() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return [];
    const raw = fs.readFileSync(MEMORY_FILE, "utf-8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeMemories(data) {
  fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(TMP_FILE, MEMORY_FILE);
}

function normalize(s) {
  return (s || "").toLowerCase();
}

function parseKeywords(query) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

function scoreMemory(m, keywords) {
  if (keywords.length === 0) return 0;
  const content = normalize(m.content);
  const tags = normalize((m.tags || []).join(" "));
  let hit = 0;
  for (const k of keywords) {
    if (content.includes(k)) hit += 1;
    else if (tags.includes(k)) hit += 0.6;
  }
  const ratio = hit / keywords.length;
  if (ratio <= 0) return 0;
  const tagBonus = keywords.some((k) => tags.includes(k)) ? 0.05 : 0;
  return Math.round((ratio + tagBonus) * 1000) / 1000;
}

app.get("/api/memories", (req, res) => {
  try {
    const data = readMemories();
    const rawQuery = (req.query.search || "").trim();
    const wantMeta = req.query.meta === "1";
    const limit = parseInt(req.query.limit, 10);
    const tagFilter = (req.query.tag || "").trim();

    let results = data;
    let keywords = [];
    let scored = false;

    if (rawQuery) {
      keywords = parseKeywords(rawQuery);
      scored = true;
      results = data
        .map((m) => ({ m, score: scoreMemory(m, keywords) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.m.createdAt) - new Date(a.m.createdAt);
        });
      if (limit > 0) results = results.slice(0, limit);
    } else {
      results = data
        .map((m) => ({ m, score: 0 }))
        .sort((a, b) => new Date(b.m.createdAt) - new Date(a.m.createdAt));
    }

    if (tagFilter) {
      results = results.filter((x) => (x.m.tags || []).includes(tagFilter));
    }

    const items = results.map((x) => {
      const m = { ...x.m };
      if (scored) {
        m._score = x.score;
        m._matched = keywords.filter((k) =>
          normalize(m.content).includes(k) || normalize((m.tags || []).join(" ")).includes(k)
        );
      }
      return m;
    });

    if (wantMeta) {
      return res.json({
        items,
        total: items.length,
        query: rawQuery,
        keywords,
        hasMore: !!(limit > 0 && data.length > limit),
      });
    }
    res.json(items);
  } catch (e) {
    res.json([]);
  }
});

app.get("/api/tags", (req, res) => {
  try {
    const data = readMemories();
    const tagCount = {};
    data.forEach((m) => (m.tags || []).forEach((t) => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }));
    const tags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    res.json(tags);
  } catch (e) {
    res.json([]);
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const data = readMemories();

    const dailyCount = {};
    data.forEach((m) => {
      const d = new Date(m.createdAt).toISOString().slice(0, 10);
      dailyCount[d] = (dailyCount[d] || 0) + 1;
    });

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthMemories = data.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const tagCount = {};
    data.forEach((m) => (m.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));

    const wordCount = {};
    const stopWords = "的了在是和我有就这要不也一个上人很到说要去你会着没看好自己 out".split(" ");
    data.forEach((m) => {
      const words = m.content.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, " ").split(/\s+/).filter(Boolean);
      words.forEach((w) => {
        if (w.length >= 2 && !stopWords.includes(w)) {
          wordCount[w] = (wordCount[w] || 0) + 1;
        }
      });
    });

    const topWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));

    res.json({
      dailyCount,
      monthStats: {
        total: monthMemories.length,
        chars: monthMemories.reduce((s, m) => s + (m.content || "").length, 0),
        tags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      },
      topWords,
    });
  } catch (e) {
    res.json({ dailyCount: {}, monthStats: { total: 0, chars: 0, tags: [] }, topWords: [] });
  }
});

app.post("/api/create", (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content || !content.trim()) {
      return res.json({ success: false, error: "内容不能为空" });
    }
    const data = readMemories();
    data.push({
      id: crypto.randomUUID(),
      content: content.trim(),
      tags: tags || [],
      pinned: false,
      createdAt: new Date().toISOString(),
    });
    writeMemories(data);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/delete", (req, res) => {
  try {
    const { id } = req.body;
    const data = readMemories();
    const before = data.length;
    const next = data.filter((m) => m.id !== id);
    if (next.length === before) {
      return res.json({ success: false, error: "未找到该记忆" });
    }
    writeMemories(next);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/update", (req, res) => {
  try {
    const { id, content, tags, pinned } = req.body;
    const data = readMemories();
    let found = false;
    const next = data.map((m) => {
      if (m.id !== id) return m;
      found = true;
      return {
        ...m,
        content: content !== undefined ? content : m.content,
        tags: tags !== undefined ? tags : m.tags,
        pinned: pinned !== undefined ? pinned : m.pinned,
        updatedAt: new Date().toISOString(),
      };
    });
    if (!found) {
      return res.json({ success: false, error: "未找到该记忆" });
    }
    writeMemories(next);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/clear", (req, res) => {
  try {
    writeMemories([]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 记忆库网页 v3.1 运行在 http://0.0.0.0:${PORT}`);
});