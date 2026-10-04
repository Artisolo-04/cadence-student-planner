const entryKey = (e) =>
  [e.start_slot_id, e.end_slot_id, e.day_of_week, e.group_tag, e.subject_id, e.room].join("|");

const GRID_ROOT = "[data-timetable-grid-root]";
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const CANCEL_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];
const PAD = 12;
const MAX_TRIES = 15;

let cancelCurrent = null;
let cancelPin = null;
let revealToken = 0;
let activeFlashes = [];

export function pinGridScroll(durationMs) {
  cancelPin?.();
  const root = document.querySelector(GRID_ROOT);
  if (!root) return;
  const top = root.scrollTop;
  const end = performance.now() + durationMs;
  let raf;
  cancelPin = () => {
    cancelAnimationFrame(raf);
    cancelPin = null;
  };
  (function tick() {
    if (root.scrollTop !== top) root.scrollTop = top;
    if (performance.now() < end) raf = requestAnimationFrame(tick);
    else cancelPin = null;
  })();
}

function diffEntries(prev = [], next = []) {
  const a = new Map(prev.map((e) => [entryKey(e), e]));
  const b = new Map(next.map((e) => [entryKey(e), e]));
  const added = [];
  const removed = [];
  a.forEach((e, k) => !b.has(k) && removed.push(e));
  b.forEach((e, k) => !a.has(k) && added.push(e));
  return { added, removed };
}

function findCards(root, entries) {
  const all = [...root.querySelectorAll("[data-entry-card]")];
  const out = [];
  for (const e of entries) {
    const mine = all.filter(
      (c) =>
        c.dataset.slotId === String(e.start_slot_id) &&
        c.dataset.day === String(e.day_of_week) &&
        c.dataset.subjectId === String(e.subject_id)
    );
    const wanted = e.group_tag || "all";
    const card = mine.length > 1 ? mine.find((c) => c.dataset.group === wanted) || mine[0] : mine[0];
    if (card && card.isConnected) out.push(card);
  }
  return out;
}

function computeTarget(root, cards) {
  const headerH = root.firstElementChild?.firstElementChild?.offsetHeight ?? 0;
  const rootRect = root.getBoundingClientRect();
  const viewTop = rootRect.top + headerH;
  const viewBottom = rootRect.bottom;
  const viewH = viewBottom - viewTop;

  const rects = cards.map((c) => c.getBoundingClientRect());
  let top = Math.min(...rects.map((r) => r.top));
  let bottom = Math.max(...rects.map((r) => r.bottom));
  if (bottom - top > viewH - PAD * 2) {
    top = rects[0].top;
    bottom = rects[0].bottom;
  }

  if (top >= viewTop + PAD && bottom <= viewBottom - PAD) return null;

  const h = bottom - top;
  const desiredTop = h <= viewH ? viewTop + (viewH - h) / 2 : viewTop + PAD;
  const max = root.scrollHeight - root.clientHeight;
  return Math.min(max, Math.max(0, root.scrollTop + (top - desiredTop)));
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function animateScroll(root, to, onDone) {
  cancelCurrent?.();
  cancelPin?.();
  const from = root.scrollTop;
  const dist = to - from;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || Math.abs(dist) < 2) {
    root.scrollTop = to;
    onDone?.();
    return;
  }
  const duration = Math.min(650, Math.max(260, 220 + Math.abs(dist) * 0.35));
  const t0 = performance.now();
  let raf;

  const cleanup = () => {
    cancelAnimationFrame(raf);
    CANCEL_EVENTS.forEach((ev) => window.removeEventListener(ev, onUserInput));
    if (cancelCurrent === cleanup) cancelCurrent = null;
  };
  const onUserInput = (ev) => {
    if (ev.type === "keydown" && !SCROLL_KEYS.has(ev.key)) return;
    cleanup();
    onDone?.();
  };
  CANCEL_EVENTS.forEach((ev) => window.addEventListener(ev, onUserInput, { passive: true }));
  cancelCurrent = cleanup;

  (function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    root.scrollTop = from + dist * easeInOutCubic(p);
    if (p < 1) raf = requestAnimationFrame(tick);
    else {
      cleanup();
      onDone?.();
    }
  })(t0);
}

const glow = (ringAlpha, spread, blur, glowAlpha) =>
  `0 0 0 2px rgba(251,146,60,${ringAlpha}), 0 0 ${blur}px ${spread}px rgba(251,146,60,${glowAlpha})`;

const STRONG = [
  { boxShadow: glow(0, 0, 0, 0), offset: 0 },
  { boxShadow: glow(1, 2, 22, 0.55), offset: 0.18 },
  { boxShadow: glow(0.5, 0, 10, 0.2), offset: 0.45 },
  { boxShadow: glow(0.95, 3, 26, 0.5), offset: 0.65 },
  { boxShadow: glow(0, 6, 32, 0), offset: 1 },
];

const SOFT = [
  { boxShadow: glow(0, 0, 0, 0), offset: 0 },
  { boxShadow: glow(0.9, 1, 16, 0.4), offset: 0.25 },
  { boxShadow: glow(0, 3, 22, 0), offset: 1 },
];

function flashCards(cards, soft) {
  activeFlashes.forEach((a) => a.cancel());
  activeFlashes = cards.map((el) =>
    el.animate(soft ? SOFT : STRONG, { duration: soft ? 700 : 1300, easing: "ease-out" })
  );
}

export function revealChange(prevEntries, nextEntries) {
  const { added, removed } = diffEntries(prevEntries, nextEntries);
  if (!added.length && !removed.length) return false;

  cancelPin?.();
  cancelCurrent?.();
  activeFlashes.forEach((a) => a.cancel());
  const token = ++revealToken;
  if (!added.length) return true;

  let tries = 0;
  const attempt = () => {
    if (token !== revealToken) return;
    const root = document.querySelector(GRID_ROOT);
    if (!root) return;
    const cards = findCards(root, added);
    if (!cards.length) {
      if (++tries < MAX_TRIES) requestAnimationFrame(attempt);
      return;
    }
    const target = computeTarget(root, cards);
    if (target === null) return flashCards(cards, true);
    animateScroll(root, target, () => {
      if (token !== revealToken) return;
      flashCards(findCards(root, added), false);
    });
  };

  requestAnimationFrame(() => requestAnimationFrame(attempt));
  return true;
}
