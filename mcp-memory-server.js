import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3005;
const MEMORY_FILE = path.join(__dirname, "memories.json");
const TMP_FILE = MEMORY_FILE + ".tmp";

const DEFAULT_LIMIT = 5;
const DEFAULT_SNIPPET = 300;

app.use(express.json({ limit: "5mb" }));

function readMemories() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return [];
    const raw = fs.readFileSync(MEMORY_FILE, "utf-8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("读取记忆失败:", e.message);
    return [];
  }
}

function writeMemories(data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(TMP_FILE, json, "utf-8");
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
  return ratio + tagBonus;
}

function truncate(content, max) {
  if (!max || content.length <= max) return content;
  return content.slice(0, max) + `…（共 ${content.length} 字）`;
}

function formatList(list, snippetLen) {
  return list
    .map((m, i) => {
      const tags = (m.tags || []).length ? `  标签: ${(m.tags || []).join(", ")}` : "";
      return `${i + 1}. [${m.id}] ${truncate(m.content, snippetLen)}${tags}`;
    })
    .join("\n\n");
}

const TOOLS = [
  {
    name: "memory_create",
    description: "创建一条记忆",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "记忆内容" },
        tags: { type: "array", items: { type: "string" }, description: "标签" },
      },
      required: ["content"],
    },
  },
  {
    name: "memory_search",
    description: "检索记忆。支持多关键词（空格分隔），按相关度+时间排序，默认返回 5 条。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "关键词，多个用空格分隔，如：脚伤 摔跤" },
        limit: { type: "number", description: "返回条数，默认 5" },
        snippet: { type: "number", description: "每条内容最大字符数，默认 300" },
      },
      required: ["query"],
    },
  },
  {
    name: "memory_search_by_tag",
    description: "按标签精确检索记忆",
    inputSchema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "标签名，如：求职" },
        limit: { type: "number", description: "返回条数，默认 10" },
      },
      required: ["tag"],
    },
  },
  {
    name: "memory_recent",
    description: "按时间倒序获取最近记忆，可按标签过滤",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "返回条数，默认 10" },
        tag: { type: "string", description: "可选，按标签过滤" },
        snippet: { type: "number", description: "每条内容最大字符数，默认 300" },
      },
    },
  },
  {
    name: "memory_list",
    description: "列出记忆（兼容旧版）",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "memory_delete",
    description: "按ID删除一条记忆",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "memory_clear",
    description: "清空所有记忆",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "memory_update",
    description: "编辑一条记忆（不传 tags 则保留原标签）",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["id", "content"],
    },
  },
  {
    name: "memory_search_delete",
    description: "按关键词搜索并删除匹配的记忆",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

app.post("/mcp", (req, res) => {
  const body = req.body;
  if (!body || !body.method) {
    return res.status(400).json({
      jsonrpc: "2.0",
      id: (body && body.id) || null,
      error: { code: -32600, message: "Invalid Request" },
    });
  }

  const { method, id, params } = body;

  const ok = (text) =>
    res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } });
  const fail = (code, message) =>
    res.json({ jsonrpc: "2.0", id, error: { code, message } });

  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "memory-server", version: "3.0.0" },
      },
    });
  }

  if (method === "tools/list") {
    return res.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  if (method !== "tools/call") {
    return fail(-32601, `Method not found: ${method}`);
  }

  const toolName = params && params.name;
  const args = (params && params.arguments) || {};
  const data = readMemories();
  const snippet = typeof args.snippet === "number" ? args.snippet : DEFAULT_SNIPPET;

  try {
    if (toolName === "memory_create") {
      if (!args.content || !String(args.content).trim()) {
        return ok("内容为空，未保存");
      }
      data.push({
        id: crypto.randomUUID(),
        content: String(args.content).trim(),
        tags: Array.isArray(args.tags) ? args.tags : [],
        pinned: false,
        createdAt: new Date().toISOString(),
      });
      writeMemories(data);
      return ok("记忆已保存 ✅");
    }

    if (toolName === "memory_search") {
      const keywords = parseKeywords(args.query);
      const limit = args.limit || DEFAULT_LIMIT;
      if (keywords.length === 0) return ok("请输入搜索关键词");

      const scored = data
        .map((m) => ({ m, score: scoreMemory(m, keywords) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return String(b.m.createdAt).localeCompare(String(a.m.createdAt));
        })
        .slice(0, limit)
        .map((x) => x.m);

      if (scored.length === 0) return ok(`没有找到匹配「${args.query}」的记忆`);
      return ok(`找到 ${scored.length} 条：\n\n` + formatList(scored, snippet));
    }

    if (toolName === "memory_search_by_tag") {
      const tag = normalize(args.tag);
      const limit = args.limit || 10;
      const matched = data
        .filter((m) => (m.tags || []).some((t) => normalize(t) === tag))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit);
      if (matched.length === 0) return ok(`没有标签为「${args.tag}」的记忆`);
      return ok(`标签「${args.tag}」共 ${matched.length} 条：\n\n` + formatList(matched, snippet));
    }

    if (toolName === "memory_recent" || toolName === "memory_list") {
      const limit = args.limit || (toolName === "memory_list" ? 20 : 10);
      let list = data;
      if (args.tag) {
        const tag = normalize(args.tag);
        list = list.filter((m) => (m.tags || []).some((t) => normalize(t) === tag));
      }
      const recent = list
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit);
      if (recent.length === 0) return ok("还没有记忆");
      return ok(`最近 ${recent.length} 条：\n\n` + formatList(recent, snippet));
    }

    if (toolName === "memory_delete") {
      const before = data.length;
      const next = data.filter((m) => m.id !== args.id);
      if (next.length === before) return ok("未找到该ID的记忆");
      writeMemories(next);
      return ok(`已删除记忆 ${args.id} ✅`);
    }

    if (toolName === "memory_clear") {
      writeMemories([]);
      return ok("所有记忆已清空 ✅");
    }

    if (toolName === "memory_update") {
      let found = false;
      const next = data.map((m) => {
        if (m.id !== args.id) return m;
        found = true;
        return {
          ...m,
          content: args.content !== undefined ? args.content : m.content,
          tags: Array.isArray(args.tags) ? args.tags : m.tags || [],
          updatedAt: new Date().toISOString(),
        };
      });
      if (!found) return ok("未找到该ID的记忆");
      writeMemories(next);
      return ok(`记忆 ${args.id} 已更新 ✅`);
    }

    if (toolName === "memory_search_delete") {
      const keywords = parseKeywords(args.query);
      if (keywords.length === 0) return ok("请输入搜索关键词");
      const matched = data.filter((m) => scoreMemory(m, keywords) > 0);
      const rest = data.filter((m) => scoreMemory(m, keywords) === 0);
      if (matched.length === 0) return ok("没有找到匹配的记忆");
      const preview = formatList(matched.slice(0, 10), 100);
      writeMemories(rest);
      return ok(`已删除 ${matched.length} 条匹配的记忆 ✅\n删除内容预览：\n\n${preview}`);
    }

    return fail(-32601, `Tool not found: ${toolName}`);
  } catch (e) {
    console.error("工具调用失败:", e);
    return ok(`执行出错：${e.message}`);
  }
});

app.get("/health", (req, res) => {
  const data = readMemories();
  res.json({ status: "ok", version: "3.0.0", count: data.length });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🧠 MCP 记忆库 v3.0 运行在 :${PORT}/mcp`);
});
