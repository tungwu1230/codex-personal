const SAVE_KEY = 'starlight-adventure-v3';
const MAX_TRUST = 2;
const MAX_LOG = 300;
const TYPE_SPEED = 32; // 每個字的毫秒數
const AUTO_DELAY = 1200; // 自動播放：每句停留的基本毫秒數
const AUTO_PER_CHAR = 45; // 自動播放：每個字額外停留的毫秒數
const CARD_TIME = 1700; // 章節標題卡顯示的毫秒數
const FALLBACK_BG = '../assets/starlight.png';
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const asset = path => `../assets/${path}.webp`;

// ---- 狀態與存檔 ----
function newState() {
  return { node: 'start', line: 0, trust: 0, items: ['銀色羅盤'], solved: [], puzzles: {}, log: [] };
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && STORY[s.node] && Number.isInteger(s.line) && Array.isArray(s.items) &&
        Number.isFinite(s.trust) && Array.isArray(s.solved) && Array.isArray(s.log) &&
        s.puzzles && typeof s.puzzles === 'object') {
      s.line = Math.min(Math.max(0, s.line), sequence(STORY[s.node], s).length - 1);
      return s;
    }
  } catch (e) {}
  const s = newState();
  logLine(s);
  return s;
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

let state;
let typing = null; // { timer, text }
let selectedPiece = null;
let auto = false;
let autoTimer = null;
let card = null; // { timer, then }

// ---- 台詞 ----
function asLine(raw) {
  return typeof raw === 'string' ? { text: raw } : raw;
}

function sequence(node, s = state) {
  const solved = node.puzzle && s.solved.includes(node.puzzle.id);
  return [...node.lines, ...(solved ? node.solvedLines || [] : [])];
}

function currentLines() {
  return sequence(STORY[state.node]);
}

function atEnd() {
  return state.line >= currentLines().length - 1;
}

function logLine(s = state) {
  const line = asLine(sequence(STORY[s.node], s)[s.line]);
  s.log.push({ who: line.who || null, text: line.text });
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}

// 從段落開頭累積到目前這句，決定背景與立繪
function stageAt(node, index) {
  const lines = sequence(node);
  let bg = node.bg;
  let sprite = null;
  for (let i = 0; i <= index; i++) {
    const line = asLine(lines[i]);
    if (line.bg) bg = line.bg;
    if ('sprite' in line) sprite = line.sprite;
    else if (line.who && CHARACTERS[line.who]) {
      const c = CHARACTERS[line.who];
      sprite = `${c.id}-${line.face || c.face}`;
    }
  }
  return { bg, sprite };
}

// ---- 圖片（不存在時退回預設） ----
const imageCache = {};
function probe(src) {
  if (!imageCache[src]) {
    imageCache[src] = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  return imageCache[src];
}

let bgToken = 0;
function setBackground(bg) {
  const token = ++bgToken;
  const src = bg ? asset(bg) : null;
  (src ? probe(src) : Promise.resolve(false)).then(ok => {
    if (token !== bgToken) return;
    document.documentElement.style.setProperty('--bg-image', `url('${ok ? src : FALLBACK_BG}')`);
  });
}

let spriteToken = 0;
function setSprite(name) {
  const token = ++spriteToken;
  const img = $('sprite');
  if (!name) { img.hidden = true; return; }
  const src = asset(`char/${name}`);
  probe(src).then(ok => {
    if (token !== spriteToken) return;
    if (ok) { if (img.getAttribute('src') !== src) img.src = src; img.hidden = false; }
    else img.hidden = true;
  });
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

function optionalImage(path, className) {
  const img = el('img', className);
  img.alt = '';
  img.hidden = true;
  probe(asset(path)).then(ok => { if (ok) { img.src = asset(path); img.hidden = false; } });
  return img;
}

// ---- 打字機 ----
function stopTyping() {
  if (typing) { clearInterval(typing.timer); $('line').textContent = typing.text; typing = null; }
}

function typeText(text) {
  stopTyping();
  const box = $('line');
  if (REDUCED_MOTION) { box.textContent = text; return; }
  let i = 0;
  box.textContent = '';
  typing = {
    text,
    timer: setInterval(() => {
      i++;
      box.textContent = text.slice(0, i);
      if (i >= text.length) { stopTyping(); renderControls(); }
    }, TYPE_SPEED)
  };
}

// ---- 自動播放 ----
function clearAuto() {
  clearTimeout(autoTimer);
  autoTimer = null;
}

function scheduleAuto() {
  clearAuto();
  if (!auto || typing || card || atEnd() || document.querySelector('dialog[open]')) return;
  const text = asLine(currentLines()[state.line]).text;
  autoTimer = setTimeout(advance, AUTO_DELAY + text.length * AUTO_PER_CHAR);
}

function setAuto(on) {
  auto = on;
  $('auto').setAttribute('aria-pressed', String(on));
  if (on) scheduleAuto(); else clearAuto();
}

// ---- 章節標題卡 ----
function showCard(node, then) {
  hideCard(false);
  $('card-chapter').textContent = node.chapter;
  $('title').textContent = node.title;
  const box = $('chapter-card');
  box.classList.remove('leaving');
  box.hidden = false;
  card = { then, timer: setTimeout(() => hideCard(true), CARD_TIME) };
}

function hideCard(run) {
  if (!card) return;
  const { timer, then } = card;
  clearTimeout(timer);
  card = null;
  const box = $('chapter-card');
  if (REDUCED_MOTION || !run) box.hidden = true;
  else {
    box.classList.add('leaving');
    setTimeout(() => { if (!card) box.hidden = true; }, 400);
  }
  if (run) then();
}

// ---- 獲得道具提示 ----
let toastTimer = null;
function toast(text) {
  const t = $('toast');
  clearTimeout(toastTimer);
  t.textContent = text;
  t.hidden = false;
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---- 推進 ----
function advance() {
  clearAuto();
  if (card) { hideCard(true); return; }
  if (typing) { stopTyping(); renderControls(); return; }
  if (atEnd()) return;
  state.line++;
  logLine();
  save();
  renderLine(true);
}

function skip() {
  clearAuto();
  if (card) hideCard(true);
  stopTyping();
  const last = currentLines().length - 1;
  while (state.line < last) { state.line++; logLine(); }
  save();
  renderLine(false);
}

// ---- 條件 ----
function meets(req) {
  if (!req) return true;
  if (req.items && !req.items.every(i => state.items.includes(i))) return false;
  if (req.anyItem && !req.anyItem.some(i => state.items.includes(i))) return false;
  if (req.trust != null && state.trust < req.trust) return false;
  return true;
}

function requirementText(req) {
  const parts = [];
  if (req.items) parts.push(...req.items);
  if (req.anyItem) parts.push(req.anyItem.join(' 或 '));
  if (req.trust != null) parts.push(`信任 ${req.trust}`);
  return '需要：' + parts.join('、');
}

// ---- 選項 ----
function choiceButton(choice, index) {
  const b = el('button', 'choice');
  b.append(el('span', null, String(index + 1).padStart(2, '0')));
  if (meets(choice.requires)) {
    b.append(document.createTextNode(choice.label));
    b.onclick = () => choose(choice);
  } else {
    b.disabled = true;
    b.classList.add('locked');
    const body = el('div', 'choice-body');
    body.append(el('strong', null, '🔒 ' + choice.label));
    body.append(el('small', null, (choice.lockHint ? choice.lockHint + '｜' : '') + requirementText(choice.requires)));
    b.append(body);
  }
  return b;
}

function choose(choice) {
  if (choice.restart) { reset(); return; }
  state.log.push({ choice: choice.label });
  if (choice.item && !state.items.includes(choice.item)) {
    state.items.push(choice.item);
    toast(`◇ 獲得道具：${choice.item}`);
  }
  state.trust = Math.min(MAX_TRUST, state.trust + (choice.trust || 0));
  state.node = choice.next;
  state.line = 0;
  selectedPiece = null;
  logLine();
  save();
  render(true);
  $('dialogue').focus({ preventScroll: true });
}

// ---- 排序謎題 ----
function puzzleState(p) {
  if (!state.puzzles[p.id]) state.puzzles[p.id] = { order: [...p.start], hinted: false };
  return state.puzzles[p.id];
}

function checkSolved(p, ps) {
  if (state.solved.includes(p.id) || !ps.order.every((id, i) => id === p.pieces[i].id)) return false;
  state.solved.push(p.id);
  state.line = STORY[state.node].lines.length; // 接著播放 solvedLines
  logLine();
  return true;
}

function afterPuzzleChange(p, ps) {
  const solved = checkSolved(p, ps);
  save();
  if (solved) { renderLine(true); $('dialogue').focus({ preventScroll: true }); }
  else renderControls();
}

function swapPiece(p, ps, index) {
  if (ps.hinted && index === 0) return;
  if (selectedPiece === null) selectedPiece = index;
  else if (selectedPiece === index) selectedPiece = null;
  else {
    [ps.order[selectedPiece], ps.order[index]] = [ps.order[index], ps.order[selectedPiece]];
    selectedPiece = null;
  }
  afterPuzzleChange(p, ps);
}

function useHint(p, ps) {
  const at = ps.order.indexOf(p.pieces[0].id);
  [ps.order[0], ps.order[at]] = [ps.order[at], ps.order[0]];
  ps.hinted = true;
  selectedPiece = null;
  afterPuzzleChange(p, ps);
}

function renderPuzzle(p) {
  const ps = puzzleState(p);
  const box = el('div', 'puzzle');
  box.append(el('p', 'puzzle-prompt', p.prompt));
  const grid = el('div', 'mural');
  ps.order.forEach((id, i) => {
    const piece = p.pieces.find(x => x.id === id);
    const fixed = ps.hinted && i === 0;
    const b = el('button', 'tablet');
    b.setAttribute('aria-pressed', String(selectedPiece === i));
    if (fixed) { b.classList.add('fixed'); b.setAttribute('aria-disabled', 'true'); }
    b.setAttribute('aria-label', `第 ${i + 1} 塊石板：${piece.text}${fixed ? '（已固定）' : ''}`);
    b.append(el('span', 'tablet-no', ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][i] || i + 1));
    if (piece.image) b.append(optionalImage(piece.image, 'tablet-img'));
    b.append(el('span', 'tablet-text', piece.text));
    b.onclick = () => swapPiece(p, ps, i);
    grid.append(b);
  });
  box.append(grid);
  if (p.hintItem && state.items.includes(p.hintItem)) {
    if (ps.hinted) box.append(el('p', 'puzzle-hint', '✦ ' + p.hintText));
    else {
      const h = el('button', 'text-button hint-button', '◇ ' + p.hintLabel);
      h.onclick = () => useHint(p, ps);
      box.append(h);
    }
  }
  return box;
}

// ---- 畫面 ----
function renderLine(animate) {
  const node = STORY[state.node];
  const line = asLine(currentLines()[state.line]);
  const stage = stageAt(node, state.line);
  setBackground(stage.bg);
  setSprite(stage.sprite);

  const speaker = $('speaker');
  speaker.hidden = !line.who;
  speaker.textContent = line.who || '';
  $('dialogue').classList.toggle('narration', !line.who);

  if (animate) typeText(line.text);
  else { stopTyping(); $('line').textContent = line.text; }
  renderControls();
}

function renderControls() {
  const node = STORY[state.node];
  const total = currentLines().length;
  const end = atEnd();
  const waiting = !!typing || !end;
  $('progress').textContent = `${state.line + 1} / ${total}`;
  $('next-mark').hidden = !waiting;
  $('skip').disabled = end && !typing;
  $('dialogue').setAttribute('aria-disabled', String(!waiting));

  if (waiting) {
    $('choices').replaceChildren();
    $('stage').classList.remove('choosing');
    scheduleAuto();
    return;
  }

  const puzzle = node.puzzle;
  const area = [];
  let choices;
  if (puzzle && !state.solved.includes(puzzle.id)) {
    area.push(renderPuzzle(puzzle));
    choices = node.giveUp || [];
  } else {
    choices = node.choices || [{ label: '再次踏上旅程', restart: true }];
  }
  area.push(...choices.map(choiceButton));
  $('choices').replaceChildren(...area);
  $('choices').scrollTop = 0;
  $('stage').classList.add('choosing');
}

function renderJournal() {
  $('trust').textContent = `${state.trust} / ${MAX_TRUST}`;
  $('trust-lamps').replaceChildren(...Array.from({ length: MAX_TRUST }, (_, i) =>
    el('i', 'trust-lamp' + (i < state.trust ? ' on' : ''))));
  // 已取得的在前；未取得的只顯示空格，不透露名稱
  const all = Object.keys(ITEMS);
  const owned = [...state.items, ...all.filter(i => !state.items.includes(i))];
  $('item-count').textContent = `${state.items.length} / ${Math.max(all.length, state.items.length)}`;
  $('inventory').replaceChildren(...owned.map(item => {
    const has = state.items.includes(item);
    const li = el('li', has ? null : 'empty');
    const slot = el('div', 'item-slot');
    if (has) {
      if (ITEMS[item]) slot.append(optionalImage(`items/${ITEMS[item]}`, 'item-icon'));
      slot.append(el('span', 'item-initial', item[0]));
    } else slot.textContent = '？';
    li.append(slot, el('span', null, has ? item : '尚未取得'));
    return li;
  }));
}

// animate 為 true 時（進入新段落）先顯示章節標題卡，再開始逐字演出
function render(animate) {
  const node = STORY[state.node];
  $('location').textContent = node.location;
  $('chapter').textContent = node.chapter;
  $('stage').classList.toggle('is-ending', !!node.ending);
  renderJournal();
  if (!animate) { hideCard(false); renderLine(false); return; }
  // 先換好背景與立繪，標題卡淡出時畫面已就緒
  const stage = stageAt(node, state.line);
  setBackground(stage.bg);
  setSprite(stage.sprite);
  stopTyping();
  $('line').textContent = '';
  $('speaker').hidden = true;
  $('choices').replaceChildren();
  $('stage').classList.remove('choosing');
  showCard(node, () => renderLine(true));
}

// ---- 對白紀錄 ----
function openSheet(id) {
  clearAuto();
  $(id).showModal();
}

function openLog() {
  if (card) hideCard(true);
  stopTyping();
  renderControls();
  $('log-list').replaceChildren(...state.log.map(entry => {
    const li = el('li', entry.choice ? 'log-choice' : null);
    if (entry.choice) li.textContent = '▸ ' + entry.choice;
    else {
      if (entry.who) li.append(el('strong', null, entry.who));
      li.append(el('span', null, entry.text));
    }
    return li;
  }));
  openSheet('log');
  const list = $('log-list');
  list.scrollTop = list.scrollHeight;
}

function reset() {
  setAuto(false);
  state = newState();
  logLine();
  selectedPiece = null;
  save();
  render(true);
}

// ---- 事件 ----
$('dialogue').onclick = advance;
$('scene').onclick = advance;
$('chapter-card').onclick = advance;
$('skip').onclick = skip;
$('auto').onclick = () => setAuto(!auto);
$('log-open').onclick = openLog;
$('journal-open').onclick = () => openSheet('journal');
$('menu-open').onclick = () => openSheet('menu');
document.querySelectorAll('dialog').forEach(d => {
  d.querySelector('[data-close]').onclick = () => d.close();
  d.onclick = e => { if (e.target === d) d.close(); }; // 點擊面板外側關閉
  d.addEventListener('close', scheduleAuto);
});
$('restart').onclick = () => {
  if (confirm('確定要重新開始嗎？目前的旅程進度將被清除。')) { $('menu').close(); reset(); }
};
if (document.fullscreenEnabled) {
  $('fullscreen').hidden = false;
  $('fullscreen').onclick = () => {
    $('menu').close();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };
}
document.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key !== ' ' && e.key !== 'Enter') return;
  const t = e.target;
  if (t !== document.body && t !== $('dialogue')) return;
  e.preventDefault();
  advance();
});

Promise.all([probe(asset('ui/trust-on')), probe(asset('ui/trust-off'))]).then(ok => {
  $('journal').classList.toggle('has-lamps', ok.every(Boolean));
});

state = loadState();
save();
render(state.line === 0 && state.log.length <= 1);
