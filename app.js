/* ============ 常量与状态 ============ */
const QUOTES = [
  "记忆是时间的礼物",
  "每一刻都值得珍藏",
  "把美好装进口袋",
  "时光不语，记忆长存",
  "记录生活的小确幸",
  "让回忆有处可栖",
  "岁月留痕，温暖如初",
  "你的故事，值得被记住",
];

const TAG_COLORS = [
  {bg:'#e8f1f0',text:'#3d6b67',border:'#cde3e0'},
  {bg:'#dfecea',text:'#35605c',border:'#c2dbd8'},
  {bg:'#eef4f3',text:'#4a7c78',border:'#d5e6e4'},
  {bg:'#e3eeec',text:'#406f6b',border:'#c8dfdc'},
  {bg:'#dcebe9',text:'#2f5753',border:'#bcd6d3'},
  {bg:'#f1f6f5',text:'#5a8a86',border:'#dae9e7'},
  {bg:'#d6e7e5',text:'#2d5551',border:'#b7d3d0'},
  {bg:'#eaf2f1',text:'#437470',border:'#d0e3e1'},
];

let memories = [];
let stats = null;
let currentSort = 'newest';
let activeTag = null;
let tagColorMap = {};
let colorIndex = 0;
let tagExpanded = false;
let _kw = [];

const ICONS = {};
ICONS.home = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>';
ICONS.dashboard = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>';
ICONS.memory = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 6.5h16"/></svg>';
ICONS.cloud = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.5 9.5 3.5 3.5 0 0 1 17 16z"/></svg>';
ICONS.breath = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22A10 10 0 0 1 2 12"/></svg>';
ICONS.moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
ICONS.sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
ICONS.refresh = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';
ICONS.plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
ICONS.import = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></svg>';
ICONS.export = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M4 21h16"/></svg>';
ICONS.trash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/></svg>';
ICONS.edit = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
ICONS.pin = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3l7 7-4 1-3 3 1 5-1 1-4-4-4 4-1-1 4-4-4-4 1-1 5 1 3-3z"/></svg>';
ICONS.pinOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3H7l3-3z"/></svg>';
ICONS.inbox = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/></svg>';
ICONS.sad = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 15s1.5-1.5 3.5-1.5S15.5 15 15.5 15"/><path d="M9 9h.01M15 9h.01"/></svg>';
ICONS.chart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
ICONS.calendar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M8 2.5v4M16 2.5v4"/></svg>';
ICONS.wordcloud = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 17a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16 8.5a3.5 3.5 0 0 1 .5 8.5z"/></svg>';
ICONS.logo = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:56px;height:56px;color:var(--accent);"><circle cx="12" cy="12" r="3.2"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22A10 10 0 0 1 2 12"/><path d="M4.9 4.9l3 3"/><path d="M19.1 19.1l-3-3"/></svg>';

/* ============ 页面切换 ============ */
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === name);
  });
  if (name === 'dashboard') { renderHeatmap(); renderReport(); }
  if (name === 'cloud') renderWordcloud();
  if (name === 'breath') loadBreath();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ 主题 ============ */
function toggleTheme() {
  const h = document.documentElement;
  const n = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  h.setAttribute('data-theme', n);
  updateThemeIcon();
  showToast(n === 'dark' ? '夜间模式' : '日间模式');
}

function updateThemeIcon() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = dark ? ICONS.sun : ICONS.moon;
}

/* ============ 标签颜色 ============ */
function getTagColor(t) {
  if (!tagColorMap[t]) {
    tagColorMap[t] = TAG_COLORS[colorIndex % TAG_COLORS.length];
    colorIndex++;
  }
  return tagColorMap[t];
}

/* ============ 数据加载 ============ */
let searchTimer;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadMemories, 300);
}

async function loadMemories() {
  const s = document.getElementById('search').value.trim();
  _kw = s ? s.split(/\s+/).filter(Boolean) : [];

  try {
    if (!s) {
      // 无搜索词：走原接口，全量加载
      const r = await fetch('/api/memories');
      memories = await r.json();
    } else {
      // 有搜索词：走语义搜索接口
      const r = await fetch('/api/search?q=' + encodeURIComponent(s) + '&k=30');
      const d = await r.json();
      memories = (d && d.results) ? d.results : [];
    }
    updateTagFilter();
    renderCards();
    applyHighlight();
  } catch (e) {
    document.getElementById('list').innerHTML =
      '<div class="empty-state">' + ICONS.sad + '<p>加载失败</p></div>';
  }
}


async function loadStats() {
  try {
    const r = await fetch('/api/stats');
    stats = await r.json();
    renderHomeStats();
    renderHeatmap();
    renderReport();
    renderWordcloud();
  } catch (e) {}
}

/* ============ 首页统计 ============ */
function renderHomeStats() {
  if (!stats) return;
  const el = document.getElementById('homeStats');
  if (!el) return;
  const total = memories.length;
  const chars = stats.monthStats ? stats.monthStats.chars : 0;
  const kw = stats.topWords ? stats.topWords.length : 0;
  el.innerHTML =
    '<div class="hero-stat"><div class="num">' + total + '</div><div class="label">条记忆</div></div>' +
    '<div class="hero-stat"><div class="num">' + chars + '</div><div class="label">本月字数</div></div>' +
    '<div class="hero-stat"><div class="num">' + kw + '</div><div class="label">关键词</div></div>';
}

/* ============ 排序 ============ */
function setSort(s) {
  currentSort = s;
  document.querySelectorAll('[id^="sort"]').forEach(b => {
    b.style.background = 'var(--card-bg)';
    b.style.color = 'var(--text-secondary)';
    b.style.borderColor = 'var(--card-border)';
  });
  const btn = document.getElementById('sort' + s.charAt(0).toUpperCase() + s.slice(1));
  if (btn) {
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--accent)';
  }
  renderCards();
}

/* ============ 标签筛选 ============ */
function updateTagFilter() {
  const s = new Set();
  memories.forEach(m => (m.tags || []).forEach(t => s.add(t)));
  const tags = Array.from(s);
  const bar = document.getElementById('tagFilterBar');
  if (!bar) return;
  if (tags.length === 0) { bar.innerHTML = ''; return; }

  // 默认只显示前 8 个，展开后全部
  const LIMIT = 8;
  const show = tagExpanded ? tags : tags.slice(0, LIMIT);

  let h = '<button class="tag-filter-btn' + (activeTag === null ? ' active' : '') + '" onclick="filterTag(null)">全部</button>';
  h += show.map(t =>
    '<button class="tag-filter-btn' + (activeTag === t ? ' active' : '') +
    '" onclick="filterTag(\'' + t + '\')" style="color:' + getTagColor(t).text + '">' + t + '</button>'
  ).join('');

  if (tags.length > LIMIT) {
    h += '<button class="tag-filter-btn" onclick="toggleTagExpand()" style="color:var(--accent);border-color:var(--accent)">' +
      (tagExpanded ? '收起' : '更多 +' + (tags.length - LIMIT)) + '</button>';
  }
  bar.innerHTML = h;
}

function toggleTagExpand() { tagExpanded = !tagExpanded; updateTagFilter(); }
function filterTag(t) { activeTag = t; updateTagFilter(); renderCards(); }
/* ============ 日历 ============ */
let calYear, calMonth, activeDate = null;

function openCalendar() {
  const now = new Date();
  if (activeDate) {
    const d = new Date(activeDate + 'T00:00:00');
    calYear = d.getFullYear(); calMonth = d.getMonth();
  } else {
    calYear = now.getFullYear(); calMonth = now.getMonth();
  }
  document.getElementById('calendarOverlay').style.display = 'flex';
  renderCalendar();
}

function closeCalendar() {
  document.getElementById('calendarOverlay').style.display = 'none';
}

function renderCalendar() {
  const label = document.getElementById('calMonthLabel');
  const days = document.getElementById('calDays');
  if (!label || !days) return;

  label.textContent = calYear + ' 年 ' + (calMonth + 1) + ' 月';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  const counts = (stats && stats.dailyCount) ? stats.dailyCount : {};

  let html = '';

  for (let i = firstDay - 1; i >= 0; i--) {
    html += '<div class="cal-day other">' + (prevDays - i) + '</div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const hasData = counts[key] > 0;
    const cls = ['cal-day'];
    if (hasData) cls.push('has-data');
    if (key === todayStr) cls.push('today');
    if (key === activeDate) cls.push('selected');
    html += '<div class="' + cls.join(' ') + '" onclick="selectDate(\'' + key + '\')">' + d + '</div>';
  }

  const total = firstDay + daysInMonth;
  const tail = (7 - (total % 7)) % 7;
  for (let i = 1; i <= tail; i++) {
    html += '<div class="cal-day other">' + i + '</div>';
  }

  days.innerHTML = html;
}

function selectDate(key) {
  activeDate = key;
  closeCalendar();
  renderCards();
  const c = document.getElementById('count');
  if (c && activeDate) {
    const n = memories.filter(m => {
      const d = new Date(m.createdAt);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return k === activeDate;
    }).length;
    c.textContent = activeDate + ' · ' + n + ' 条记忆';
  }
}

function calClearDate() {
  activeDate = null;
  closeCalendar();
  loadMemories();
}

function calGoToday() {
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  renderCalendar();
}

function calendarPrev() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calendarNext() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }


/* ============ 渲染：时间轴 ============ */
function renderCards() {
  const totalChars = memories.reduce((s, m) => s + (m.content || '').length, 0);
  const countEl = document.getElementById('count');
  const wordEl = document.getElementById('wordCount');
if (countEl && !activeDate) countEl.textContent = '共 ' + memories.length + ' 条记忆';
  if (wordEl) wordEl.textContent = ' · ' + totalChars + ' 字';

let filtered = memories.slice();
if (activeTag) filtered = filtered.filter(m => (m.tags || []).includes(activeTag));
if (activeDate) filtered = filtered.filter(m => {
  const d = new Date(m.createdAt);
  const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return k === activeDate;
});
  if (currentSort === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (currentSort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (currentSort === 'pinned') filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const list = document.getElementById('list');
  if (!list) return;
  if (filtered.length === 0) {
    list.className = 'card-grid';
    list.innerHTML = '<div class="empty-state">' + ICONS.inbox + '<p>还没有记忆</p></div>';
    return;
  }

  const groups = {};
  filtered.forEach(m => {
    const d = new Date(m.createdAt);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    (groups[key] = groups[key] || []).push(m);
  });
  const keys = Object.keys(groups).sort((a, b) => currentSort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a));
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  list.className = 'timeline';
  list.innerHTML = keys.map(key => {
    const d = new Date(key + 'T00:00:00');
    const label = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 周' + dayNames[d.getDay()];
    const items = groups[key].map(m =>
      '<div class="timeline-item' + (m.pinned ? ' pinned' : '') + '" id="item-' + m.id + '">' +
        (m.pinned ? '<div class="pin-badge">' + ICONS.pin + '</div>' : '') +
        '<div class="content" onclick="toggleExpand(\'' + m.id + '\')">' + escapeHtml(m.content) + '</div>' +
        (m.tags && m.tags.length
          ? '<div class="tags">' + m.tags.map(t => {
              const c = getTagColor(t);
              return '<span class="tag" style="background:' + c.bg + ';color:' + c.text +
                ';border-color:' + c.border + '" onclick="filterTag(\'' + t + '\')">' + t + '</span>';
            }).join('') + '</div>'
          : '') +
        '<div class="meta"><span>' + new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
          '<div class="card-actions">' +
            '<button onclick="inlineEdit(\'' + m.id + '\')" title="编辑">' + ICONS.edit + '</button>' +
            '<button onclick="togglePin(\'' + m.id + '\')" title="置顶">' + ICONS.pinOutline + '</button>' +
            '<button class="del-btn" onclick="deleteMemory(\'' + m.id + '\')" title="删除">' + ICONS.trash + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('');
    return '<div class="timeline-day"><div class="timeline-day-label">' + label + '</div>' +
      '<div class="timeline-items">' + items + '</div></div>';
  }).join('');
}

function toggleExpand(id) {
  const el = document.getElementById('item-' + id);
  if (el) el.classList.toggle('expanded');
}
function toggleExpandEl(el) {
  const card = el.closest('.breath-card');
  if (card) card.classList.toggle('expanded');
}


/* ============ 内联编辑 ============ */
function inlineEdit(id) {
  const el = document.querySelector('#item-' + id + ' .content') || document.getElementById('content-' + id);
  const m = memories.find(x => x.id === id);
  if (!m || !el) return;
  const txt = document.createElement('textarea');
  txt.value = m.content;
  txt.style.cssText = 'width:100%;padding:8px;font-size:13px;font-family:inherit;border:1.5px solid var(--accent);border-radius:8px;background:var(--input-bg);color:var(--text);resize:vertical;min-height:60px;outline:none;';
  txt.onblur = async function () {
    const val = txt.value.trim();
    if (val && val !== m.content) {
      try {
        await fetch('/api/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, content: val })
        });
        showToast('已更新');
        loadMemories(); loadStats();
      } catch (e) { showToast('更新失败'); }
    } else { el.textContent = m.content; }
  };
  txt.onkeydown = function (e) {
    if (e.key === 'Escape') el.textContent = m.content;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); txt.blur(); }
  };
  el.textContent = '';
  el.appendChild(txt);
  txt.focus();
}

/* ============ 工具函数 ============ */
function formatDate(d) {
  if (!d) return '未知';
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
function showToast(m) {
  const o = document.querySelector('.toast');
  if (o) o.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

/* ============ 增删改 ============ */
async function deleteMemory(id) {
  if (!confirm('确定删除？')) return;
  try {
    const r = await fetch('/api/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const d = await r.json();
    showToast(d.success ? '已删除' : '失败');
    loadMemories(); loadStats();
  } catch (e) { showToast('失败'); }
}

async function togglePin(id) {
  const m = memories.find(x => x.id === id);
  if (!m) return;
  try {
    const r = await fetch('/api/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pinned: !m.pinned })
    });
    const d = await r.json();
    showToast(d.success ? (m.pinned ? '已取消置顶' : '已置顶') : '失败');
    loadMemories();
  } catch (e) { showToast('失败'); }
}

function confirmClear() {
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.innerHTML =
    '<div class="modal"><h3>确认清空</h3>' +
    '<p>此操作会删除<strong>全部记忆</strong>，且不可撤销。<br>请输入「确认清空」以继续：</p>' +
    '<div class="form-group"><input id="clearConfirmInput" placeholder="在此输入：确认清空" autocomplete="off"></div>' +
    '<div class="modal-actions">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()">取消</button>' +
    '<button id="clearConfirmBtn" disabled style="background:var(--danger-bg);border-color:var(--danger);color:var(--danger);opacity:0.5;cursor:not-allowed;">确定清空</button>' +
    '</div></div>';
  document.body.appendChild(o);

  const input = document.getElementById('clearConfirmInput');
  const btn = document.getElementById('clearConfirmBtn');
  input.focus();
  input.oninput = function () {
    const ok = input.value.trim() === '确认清空';
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.5';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
  };
  btn.onclick = function () {
    if (input.value.trim() !== '确认清空') return;
    clearAllMemories(btn);
  };
}

async function clearAllMemories(btn) {
  btn.textContent = '清空中...'; btn.disabled = true;
  try {
    const r = await fetch('/api/clear', { method: 'POST' });
    const d = await r.json();
    showToast(d.success ? '已清空' : '失败');
    document.querySelector('.modal-overlay')?.remove();
    loadMemories(); loadStats();
  } catch (e) { showToast('失败'); }
}

function refreshList() { loadMemories(); loadStats(); showToast('已刷新'); }

function showAddModal() {
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.innerHTML =
    '<div class="modal"><h3>新增记忆</h3>' +
    '<div class="form-group"><label>内容</label><textarea id="newContent" rows="3"></textarea></div>' +
    '<div class="form-group"><label>标签（逗号分隔）</label><input id="newTags" placeholder="例如：日常, 心情"></div>' +
    '<div class="modal-actions">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()">取消</button>' +
    '<button onclick="submitNewMemory()" class="btn-primary">保存</button>' +
    '</div></div>';
  document.body.appendChild(o);
  setTimeout(() => document.getElementById('newContent').focus(), 100);
}
async function submitNewMemory() {
  const c = document.getElementById('newContent').value.trim();
  if (!c) { showToast('内容不能为空'); return; }
  const tags = document.getElementById('newTags').value.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  try {
    const r = await fetch('/api/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: c, tags })
    });
    const d = await r.json();
    if (d.success) {
      showToast('已添加');
      document.querySelector('.modal-overlay')?.remove();
      loadMemories(); loadStats();
    } else { showToast(d.error); }
  } catch (e) { showToast('添加失败'); }
}

function showImportModal() { document.getElementById('fileInput').click(); }
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) { showToast('格式错误，需要 JSON 数组'); return; }
    let added = 0;
    for (const item of data) {
      if (item.content && item.content.trim()) {
        await fetch('/api/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: item.content.trim(), tags: item.tags || [] })
        });
        added++;
      }
    }
    showToast('成功导入 ' + added + ' 条');
    loadMemories(); loadStats();
  } catch (e) { showToast('导入失败：' + e.message); }
  e.target.value = '';
}

function showExportMenu() {
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.innerHTML =
    '<div class="modal"><h3>导出记忆</h3><p>选择导出格式：</p>' +
    '<div class="modal-actions" style="flex-wrap:wrap;">' +
    '<button onclick="exportMemories(\'json\')">JSON</button>' +
    '<button onclick="exportMemories(\'txt\')">TXT</button>' +
    '<button onclick="exportMemories(\'md\')">Markdown</button>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="border-color:var(--danger);color:var(--danger);">取消</button>' +
    '</div></div>';
  document.body.appendChild(o);
}
function exportMemories(fmt) {
  document.querySelector('.modal-overlay')?.remove();
  let text = '';
  if (fmt === 'json') text = JSON.stringify(memories, null, 2);
  else if (fmt === 'txt') text = memories.map(m =>
    '[' + formatDate(m.createdAt) + '] ' + (m.pinned ? '[置顶] ' : '') + m.content +
    (m.tags && m.tags.length ? ' [' + m.tags.join(', ') + ']' : '')
  ).join('\n\n');
  else if (fmt === 'md') text = '# Mnemosyne\n\n' + memories.map(m =>
    '## ' + (m.pinned ? '[置顶] ' : '') + formatDate(m.createdAt) + '\n\n' + m.content +
    (m.tags && m.tags.length ? '\n\n' + m.tags.map(t => '`' + t + '`').join(' ') : '')
  ).join('\n\n---\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'memories.' + fmt;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('已导出 ' + fmt.toUpperCase());
}

/* ============ 热力图 ============ */
function renderHeatmap() {
  if (!stats) return;
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 364);
  let html = '';
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const cnt = (stats.dailyCount && stats.dailyCount[key]) || 0;
    const level = cnt > 5 ? 5 : cnt > 3 ? 4 : cnt > 2 ? 3 : cnt > 1 ? 2 : cnt > 0 ? 1 : 0;
    html += '<div class="heatmap-cell l' + level + '" data-title="' + key + ': ' + cnt + ' 条"></div>';
  }
  grid.innerHTML = html;
}

/* ============ 月度报告 ============ */
function renderReport() {
  if (!stats || !stats.monthStats) return;
  const m = stats.monthStats;
  const now = new Date();
  const mn = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const el = document.getElementById('reportCard');
  if (!el) return;
  el.innerHTML =
    '<div style="text-align:center;margin-bottom:10px;color:var(--accent);font-weight:600;">' +
    now.getFullYear() + '年 ' + mn[now.getMonth()] + ' 记忆报告</div>' +
    '<div class="report-grid">' +
    '<div class="report-item"><div class="num">' + m.total + '</div><div class="label">新增记忆</div></div>' +
    '<div class="report-item"><div class="num">' + m.chars + '</div><div class="label">总字数</div></div>' +
    '<div class="report-item"><div class="num">' + (m.total ? Math.round(m.chars / m.total) : 0) + '</div><div class="label">平均字数</div></div>' +
    '</div>' +
    (m.tags && m.tags.length
      ? '<div class="report-tags">' + m.tags.map(([t, c]) => {
          const col = getTagColor(t);
          return '<span class="tag" style="background:' + col.bg + ';color:' + col.text +
            ';border-color:' + col.border + ';padding:2px 10px;border-radius:20px;font-size:10px;">' + t + ' (' + c + ')</span>';
        }).join('') + '</div>'
      : '');
}

/* ============ 词云 ============ */
function renderWordcloud() {
  const el = document.getElementById('wordcloudBox');
  if (!el) return;
  if (!stats || !stats.topWords || !stats.topWords.length) {
    el.innerHTML = '<span style="color:var(--text-secondary);">还没有足够的词云数据</span>';
    return;
  }

  const words = stats.topWords.slice(0, 40);
  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;
  const range = Math.max(maxCount - minCount, 1);

  // 8 种配色（浅底深字 / 深底浅字交替）
  const palette = [
    { bg: '#e3efed', fg: '#2f5f5a' },
    { bg: '#d6e7e5', fg: '#2d5551' },
    { bg: '#edf5f4', fg: '#4a7c78' },
    { bg: '#dfecea', fg: '#35605c' },
    { bg: '#eaf2f1', fg: '#437470' },
    { bg: '#dcebe9', fg: '#2f5753' },
    { bg: '#f1f6f5', fg: '#5a8a86' },
    { bg: '#e8f1f0', fg: '#3d6b67' },
  ];

  el.innerHTML = words.map((w, i) => {
    const ratio = (w.count - minCount) / range;       // 0~1
    const fs = 12 + ratio * 22;                       // 字号 12~34
    const padY = 6 + ratio * 6;
    const padX = 12 + ratio * 10;
    const c = palette[i % palette.length];
    const alpha = 0.55 + ratio * 0.45;
    return '<span class="wc-word" ' +
      'style="font-size:' + fs.toFixed(1) + 'px;padding:' + padY.toFixed(1) + 'px ' + padX.toFixed(1) + 'px;' +
      'background:' + c.bg + ';color:' + c.fg + ';opacity:' + alpha.toFixed(2) + ';" ' +
      'title="' + w.count + ' 次，点击搜索" ' +
      'onclick="searchWord(\'' + String(w.word).replace(/'/g, "\\'") + '\')">' +
      escapeHtml(w.word) + '</span>';
  }).join('');
}

/* 点词云 → 跳到记忆页并搜索 */
function searchWord(word) {
  switchPage('memories');
  const el = document.getElementById('search');
  if (el) { el.value = word; }
  loadMemories();
}


/* ============ 搜索高亮 ============ */
function applyHighlight() {
  if (_kw.length === 0) return;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const inner = '(' + _kw.map(esc).join('|') + ')';
  document.querySelectorAll('#list .content').forEach(el => {
    const src = el.textContent;
    const low = src.toLowerCase();
    const has = _kw.some(k => low.indexOf(k.toLowerCase()) > -1);
    if (has) {
      const pat = new RegExp(inner, 'gi');
      el.innerHTML = src.replace(pat,
        '<mark style="background:rgba(90,155,150,0.22);color:inherit;border-radius:3px;padding:1px 3px;font-weight:600;">$1</mark>');
    }
  });
  const n = document.querySelectorAll('#list .timeline-item, #list .memory-card').length;
  const c = document.getElementById('count');
  if (c) c.textContent = '找到 ' + n + ' 条（关键词：' + _kw.join(' / ') + '）';
}

/* ============ 渲染：呼吸页 ============ */
async function loadBreath() {
  const el = document.getElementById('breathBox');
  if (!el) return;

  el.innerHTML = '<div class="breath-loading">正在呼吸…</div>';

  let data;
  try {
    const r = await fetch('/api/breath');
    data = await r.json();
  } catch (e) {
    el.innerHTML = '<div class="breath-loading">呼吸失败：' + e + '</div>';
    return;
  }

  if (!data.ok || data.empty) {
    el.innerHTML = '<div class="breath-empty">记忆库还是空的。等有第一条记忆，这里就会浮起东西。</div>';
    return;
  }

  const tagHtml = (m) => (m.tags && m.tags.length)
    ? '<div class="tags">' + m.tags.map(t => {
        const c = getTagColor(t);
        return '<span class="tag" style="background:' + c.bg + ';color:' + c.text +
          ';border-color:' + c.border + '" onclick="filterTag(\'' + t + '\')">' + t + '</span>';
      }).join('') + '</div>'
    : '';

  const timeHtml = (m) => new Date(m.createdAt).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

   const card = (m, cls) => `
    <div class="breath-card ${cls || ''}">
      <div class="content" onclick="toggleExpandEl(this)">${escapeHtml(m.content || '')}</div>
      ${tagHtml(m)}
      <div class="meta"><span>${timeHtml(m)}</span></div>
    </div>`;


  el.innerHTML = `
    <div class="breath-hero">
      <div class="breath-orb"></div>
      <div class="breath-total">${data.total} 条记忆正在呼吸</div>
    </div>

    ${data.fortune ? `
      <section class="breath-section">
        <h3 class="breath-title">今日浮签</h3>
        ${card(data.fortune, 'breath-fortune')}
      </section>` : ''}

    ${data.profile && data.profile.length ? `
      <section class="breath-section">
        <h3 class="breath-title">关于你</h3>
        ${data.profile.map(m => card(m, 'breath-profile')).join('')}
      </section>` : ''}

    ${data.state && data.state.length ? `
      <section class="breath-section">
        <h3 class="breath-title">当前状态</h3>
        ${data.state.map(m => card(m, 'breath-state')).join('')}
      </section>` : ''}

    <section class="breath-section">
      <h3 class="breath-title">近日</h3>
      ${data.recent.map(m => card(m)).join('')}
    </section>
  `;
}



/* ============ 底栏/入口图标注入 ============ */
function injectNavIcons() {
  const navMap = { home: ICONS.home, dashboard: ICONS.dashboard, memories: ICONS.memory, cloud: ICONS.cloud, breath: ICONS.breath };
  document.querySelectorAll('.nav-item').forEach(btn => {
    const key = btn.dataset.page;
    if (navMap[key]) btn.innerHTML = navMap[key] + '<span>' + btn.textContent + '</span>';
  });
  document.querySelectorAll('[data-icon]').forEach(el => {
    const key = el.dataset.icon;
    if (ICONS[key]) el.innerHTML = ICONS[key];
  });
  const logo = document.getElementById('heroLogo');
  if (logo) logo.innerHTML = ICONS.logo || ICONS.memory;
}

/* ============ 初始化 ============ */
async function init() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
  injectNavIcons();

  const hq = document.getElementById('homeQuote');
  if (hq) hq.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  switchPage('home');

  await loadMemories();
  await loadStats();
}

window.addEventListener('DOMContentLoaded', init);
