const SAVE_KEY = 'starlight-adventure-v2';
const MAX_TRUST = 2;
const $ = id => document.getElementById(id);

function newState() {
  return { node: 'start', trust: 0, items: ['銀色羅盤'], solved: [], puzzles: {} };
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && STORY[s.node] && Array.isArray(s.items) && Number.isFinite(s.trust) &&
        Array.isArray(s.solved) && s.puzzles && typeof s.puzzles === 'object') return s;
  } catch (e) {}
  return newState();
}

let state = loadState();
let selectedPiece = null;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
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
  const unlocked = meets(choice.requires);
  if (unlocked) {
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
  if (choice.item && !state.items.includes(choice.item)) state.items.push(choice.item);
  state.trust = Math.min(MAX_TRUST, state.trust + (choice.trust || 0));
  state.node = choice.next;
  selectedPiece = null;
  save();
  render();
  $('title').focus({ preventScroll: true });
  const target = matchMedia('(max-width:800px)').matches ? '.story' : '.story-body';
  document.querySelector(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- 排序謎題 ----
function puzzleOrder(p) {
  if (!state.puzzles[p.id]) state.puzzles[p.id] = { order: [...p.start], hinted: false };
  return state.puzzles[p.id];
}

function isSolvedOrder(p, order) {
  return order.every((id, i) => id === p.pieces[i].id);
}

function finishIfSolved(p, ps) {
  if (isSolvedOrder(p, ps.order) && !state.solved.includes(p.id)) state.solved.push(p.id);
}

function swapPiece(p, ps, index) {
  const locked = ps.hinted ? 0 : -1;
  if (index === locked) return;
  if (selectedPiece === null) {
    selectedPiece = index;
  } else if (selectedPiece === index) {
    selectedPiece = null;
  } else {
    [ps.order[selectedPiece], ps.order[index]] = [ps.order[index], ps.order[selectedPiece]];
    selectedPiece = null;
    finishIfSolved(p, ps);
  }
  save();
  render();
}

function useHint(p, ps) {
  const first = p.pieces[0].id;
  const at = ps.order.indexOf(first);
  [ps.order[0], ps.order[at]] = [ps.order[at], ps.order[0]];
  ps.hinted = true;
  selectedPiece = null;
  finishIfSolved(p, ps);
  save();
  render();
}

function renderPuzzle(p) {
  const ps = puzzleOrder(p);
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
    b.append(el('span', 'tablet-no', ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][i] || i + 1), el('span', null, piece.text));
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
function render() {
  const node = STORY[state.node];
  const puzzle = node.puzzle;
  const solved = puzzle && state.solved.includes(puzzle.id);

  $('location').textContent = node.location;
  $('chapter').textContent = node.chapter;
  $('title').textContent = node.title;
  $('title').tabIndex = -1;

  const paragraphs = [...node.text, ...(solved ? node.solvedText || [] : [])];
  $('text').replaceChildren(...paragraphs.map(t => el('p', null, t)));

  $('trust').textContent = `${state.trust} / ${MAX_TRUST}`;
  $('meter').style.width = (state.trust / MAX_TRUST * 100) + '%';
  $('inventory').replaceChildren(...state.items.map(item => el('li', null, item)));

  const area = [];
  let choices;
  if (puzzle && !solved) {
    area.push(renderPuzzle(puzzle));
    choices = node.giveUp || [];
  } else {
    choices = node.choices || [{ label: '再次踏上旅程', restart: true }];
  }
  area.push(...choices.map(choiceButton));
  $('choices').replaceChildren(...area);
  save();
}

function reset() {
  state = newState();
  selectedPiece = null;
  save();
  render();
}

$('restart').onclick = () => {
  if (confirm('確定要重新開始嗎？目前的旅程進度將被清除。')) reset();
};
render();
