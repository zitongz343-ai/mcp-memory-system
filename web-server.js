import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3004;
const MEMORY_FILE = path.join(__dirname, "memories.json");

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/memories", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    const search = req.query.search?.toLowerCase();
    let results = data;
    if (search) {
      results = data.filter(m => 
        m.content.toLowerCase().includes(search) ||
        (m.tags || []).some(t => t.toLowerCase().includes(search))
      );
    }
    res.json(results.reverse());
  } catch (e) {
    res.json([]);
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    
    // 按日期统计条数
    const dailyCount = {};
    data.forEach(m => {
      const d = new Date(m.createdAt).toISOString().slice(0, 10);
      dailyCount[d] = (dailyCount[d] || 0) + 1;
    });

    // 本月统计
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthMemories = data.filter(m => {
      const d = new Date(m.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    // 标签统计
    const tagCount = {};
    data.forEach(m => (m.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));

    // 词云：提取高频词
    const wordCount = {};
    const stopWords = "的了在是和我有就这要不也一个上人很到说要去你会着没看好自己 out".split(" ");
    data.forEach(m => {
      const words = m.content.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, " ").split(/\s+/).filter(Boolean);
      words.forEach(w => {
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
        chars: monthMemories.reduce((s, m) => s + (m.content || '').length, 0),
        tags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
      },
      topWords
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
    const data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    data.push({
      id: Date.now().toString(),
      content: content.trim(),
      tags: tags || [],
      pinned: false,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/delete", (req, res) => {
  try {
    const { id } = req.body;
    let data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    const before = data.length;
    data = data.filter(m => m.id !== id);
    if (data.length === before) {
      return res.json({ success: false, error: "未找到该记忆" });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/update", (req, res) => {
  try {
    const { id, content, tags, pinned } = req.body;
    let data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    let found = false;
    data = data.map(m => {
      if (m.id === id) {
        found = true;
        return {
          ...m,
          content: content !== undefined ? content : m.content,
          tags: tags !== undefined ? tags : m.tags,
          pinned: pinned !== undefined ? pinned : m.pinned,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });
    if (!found) {
      return res.json({ success: false, error: "未找到该记忆" });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/clear", (req, res) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify([], null, 2));
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 记忆库网页 v3.0 运行在 http://0.0.0.0:${PORT}`);
});
