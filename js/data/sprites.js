// ドット絵スプライト定義 (全50体 かわいい自動合成システム v2)
//
// 32x32 の半分 (16列) を描いてミラー展開する。
// 「まるいからだ + 中央寄りのおおきなうるうる目 + ちいさな口 + ほっぺ」を
// 共通テンプレートにして、耳・角・羽・炎などのパーツで個性を出す。
// パーツは体の輪郭 (hw) に沿って配置し、必ず体と接続させる。

const GW = 16, GH = 32;

// ---------- 描画ヘルパー ----------
function makeGrid() {
  return Array.from({ length: GH }, () => Array(GW).fill("."));
}
function set(g, x, y, ch) {
  if (x >= 0 && x < GW && y >= 0 && y < GH) g[y][x] = ch;
}
function at(g, x, y) {
  if (y < 0 || y >= GH) return ".";
  if (x >= GW) x = 2 * GW - 1 - x; // ミラー境界
  if (x < 0) return ".";
  return g[y][x];
}
function fillRect(g, x0, y0, x1, y1, ch) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(g, x, y, ch);
}
function oval(g, cx, cy, rx, ry, ch) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / (rx + 0.4), dy = (y - cy) / (ry + 0.4);
      if (dx * dx + dy * dy <= 1) set(g, x, y, ch);
    }
  }
}
function triUp(g, cx, baseY, halfW, h, ch) { // 上向き三角 (cx中心, baseY=底辺)
  for (let i = 0; i < h; i++) {
    const w = Math.round(halfW * (i + 1) / h);
    fillRect(g, cx - w, baseY - h + 1 + i, cx + w, baseY - h + 1 + i, ch);
  }
}

// ---------- 本体シェイプ ----------
function bodyWidths(spec) {
  const top = spec.top, bottom = spec.bottom, maxW = spec.width;
  const hw = new Array(GH).fill(0);
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / Math.max(1, bottom - top);
    const s = Math.abs(2 * t - 1);
    let w;
    switch (spec.shape) {
      case "egg": w = maxW * Math.pow(1 - Math.pow(s, 2.4), 1 / 2.4) * (0.74 + 0.26 * t); break;
      case "pear": w = maxW * Math.pow(1 - Math.pow(s, 2.6), 1 / 2.6) * (0.6 + 0.4 * t); break;
      case "square": w = maxW * Math.pow(1 - Math.pow(s, 6), 1 / 6); break;
      default: w = maxW * Math.pow(1 - Math.pow(s, 3), 1 / 3); // round
    }
    hw[y] = Math.max(2, Math.round(w));
  }
  return hw;
}

// ---------- パーツ ----------
// 中央パーツは cx=15 (ミラーでつながる)。横パーツは hw (体の輪郭) に沿わせて必ず接続。
const PARTS = {
  twinleaf(g, s) { // ふたばの芽
    const t = s.top;
    fillRect(g, 14, t - 3, 15, t + 1, "l");
    oval(g, 11, t - 5, 2, 2, "l");
    set(g, 13, t - 4, "l"); set(g, 13, t - 3, "l");
  },
  leafcap(g, s) { // 葉っぱのぼうし
    oval(g, 15, s.top + 1, s.width - 1, 4, "l");
    set(g, 9, s.top, "p"); set(g, 10, s.top, "p"); set(g, 13, s.top - 2, "y"); set(g, 14, s.top - 2, "y");
  },
  leaf1(g, s) { // 一枚葉
    fillRect(g, 14, s.top - 2, 15, s.top + 1, "l");
    oval(g, 15, s.top - 4, 2, 2, "l");
  },
  flame(g, s) { // あたまのほのお
    triUp(g, 15, s.top + 1, 4, 8, "f");
    triUp(g, 15, s.top, 2, 5, "g");
  },
  bolt(g, s) { // いなずま
    const t = s.top;
    fillRect(g, 14, t - 6, 15, t - 5, "z");
    fillRect(g, 13, t - 4, 14, t - 3, "z");
    fillRect(g, 14, t - 2, 15, t + 1, "z");
  },
  droplet(g, s) { // しずく
    set(g, 15, t0(s) - 5, "h");
    oval(g, 15, s.top - 3, 2, 2, "h");
    fillRect(g, 15, s.top - 1, 15, s.top + 1, "h");
  },
  drip(g, s) { // ぷにっとしたたれ
    oval(g, 15, s.top - 2, 1, 1, "a");
    fillRect(g, 14, s.top - 1, 15, s.top + 2, "a");
  },
  earCat(g, s, hw) { // ねこみみ
    const ex = GW - hw[s.top + 2] + 2;
    triUp(g, ex, s.top + 1, 3, 6, "a");
    triUp(g, ex, s.top, 1, 3, "p");
  },
  earRound(g, s, hw) { // くまみみ
    const ex = GW - hw[s.top + 2] + 2;
    oval(g, ex, s.top - 1, 3, 3, "a");
    oval(g, ex, s.top - 1, 1, 1, "p");
  },
  earBunny(g, s, hw) { // うさみみ
    const ex = GW - hw[s.top + 2] + 2;
    oval(g, ex, s.top - 4, 2, 6, "a");
    oval(g, ex, s.top - 4, 0, 3, "p");
  },
  hornNubs(g, s, hw) { // ちいさなつの
    const ex = GW - hw[s.top + 2] + 3;
    triUp(g, ex, s.top + 1, 2, 5, "y");
  },
  hornLong(g, s, hw) { // りっぱなつの
    const ex = GW - hw[s.top + 2] + 3;
    triUp(g, ex, s.top + 1, 2, 4, "y");
    fillRect(g, ex - 2, s.top - 6, ex - 1, s.top - 2, "y");
    set(g, ex - 3, s.top - 7, "y"); set(g, ex - 2, s.top - 7, "y");
  },
  antler(g, s, hw) { // えだづの (でんせつ)
    const ax = GW - hw[s.top + 2] + 3;
    fillRect(g, ax, s.top - 6, ax + 1, s.top + 1, "g");
    fillRect(g, ax - 2, s.top - 5, ax - 1, s.top - 4, "g");
    set(g, ax - 2, s.top - 6, "g");
    fillRect(g, ax + 2, s.top - 4, ax + 2, s.top - 3, "g");
  },
  antennaBalls(g, s, hw) { // まるアンテナ
    const ax = GW - hw[s.top + 1] + 4;
    fillRect(g, ax, s.top - 3, ax, s.top + 1, "k");
    oval(g, ax - 1, s.top - 5, 1, 1, "z");
  },
  finGills(g, s, hw) { // みずかきエラ
    const y = s.eyeY + 2;
    const x = GW - hw[y];
    oval(g, x, y, 2, 2, "g");
  },
  flowerTop(g, s) { // あたまのはな
    const t = s.top;
    fillRect(g, 15, t - 1, 15, t + 1, "k");
    oval(g, 12, t - 4, 1, 1, "p");
    oval(g, 15, t - 6, 1, 1, "p");
    oval(g, 15, t - 2, 1, 1, "p");
    fillRect(g, 14, t - 5, 15, t - 3, "y");
  },
  flowerCrown(g, s, hw) { // はなかんむり
    const ex = GW - hw[s.top + 2] + 2;
    oval(g, ex, s.top, 1, 1, "p");
    oval(g, Math.min(15, ex + 4), s.top - 2, 1, 1, "p");
    oval(g, 15, s.top - 3, 1, 1, "y");
  },
  rockCrown(g, s, hw) { // いわのでこぼこ
    const ex = GW - hw[s.top + 2] + 2;
    oval(g, ex, s.top, 2, 2, "a");
    oval(g, 11, s.top - 1, 2, 2, "a");
    oval(g, 15, s.top - 1, 2, 2, "a");
  },
  crownGold(g, s) { // おうさまのかんむり
    fillRect(g, 11, s.top - 2, 15, s.top + 1, "y");
    fillRect(g, 11, s.top - 4, 11, s.top - 3, "y");
    fillRect(g, 13, s.top - 4, 13, s.top - 3, "y");
    fillRect(g, 15, s.top - 5, 15, s.top - 3, "y");
    set(g, 15, s.top - 1, "z");
  },
  fuzzTop(g, s, hw) { // ふわふわの毛
    const base = GW - hw[s.top + 2] + 1;
    [0, 3, 6, 9].forEach((dx, i) => {
      const x = Math.min(15, base + dx);
      oval(g, x, s.top - 1 + (i % 2), 1, 1, "f");
    });
  },
  fuzzRing(g, s, hw) { // まわりのトゲトゲ
    const mid = ((s.top + s.bottom) / 2) | 0;
    for (const r of [s.top + 3, mid, s.bottom - 4]) {
      const x = GW - hw[r] - 1;
      oval(g, x, r, 1, 1, "f");
    }
    PARTS.fuzzTop(g, s, hw);
  },
  wingNubs(g, s, hw) { // ちいさなつばさ
    const y = s.eyeY + 7;
    const x = GW - hw[y] - 1;
    oval(g, x, y + 1, 2, 3, "v");
  },
  wingBack(g, s, hw) { // おおきなつばさ (背面)
    const y = s.eyeY + 6;
    const x = GW - hw[y] - 2;
    oval(g, x - 1, y + 2, 3, 6, "v");
    set(g, x - 3, y - 3, "v"); set(g, x - 2, y - 2, "v"); set(g, x - 2, y - 3, "v");
  },
  butterflyWings(g, s) { // ちょうのはね (背面)
    const t = s.top;
    oval(g, 4, t + 4, 4, 7, "v");
    oval(g, 4, t + 4, 2, 4, "u");
    set(g, 4, t + 2, "y"); set(g, 3, t + 6, "y"); set(g, 4, t + 6, "y");
    oval(g, 5, s.bottom - 6, 3, 5, "u");
    oval(g, 5, s.bottom - 6, 1, 2, "v");
    set(g, 11, t - 3, "k"); set(g, 10, t - 4, "k"); // しょっかく
  },
  shellSide(g, s, hw) { // よこのこうら (カメ)
    for (let y = s.top + 5; y <= s.bottom - 2; y++) {
      const x = GW - hw[y];
      fillRect(g, x - 3, y, x - 1, y, "s");
    }
    const midY = ((s.top + s.bottom) / 2) | 0;
    const mx = GW - hw[midY];
    fillRect(g, mx - 2, midY - 2, mx - 2, midY + 2, "t");
  },
  moundFront(g, s) { // つちやま (前面)
    const b = s.bottom;
    for (let y = b - 3; y <= Math.min(GH - 2, b + 1); y++) {
      const w = s.width + 1 - Math.max(0, (b - 1) - y);
      fillRect(g, GW - w, y, 15, y, "s");
    }
    fillRect(g, GW - s.width, b - 3, 15, b - 3, "t");
    set(g, 8, b - 1, "t"); set(g, 12, b, "t");
  },
  headband(g, s, hw) { // はちまき
    const y = s.eyeY - 3;
    for (let r = y; r <= y + 1; r++) {
      fillRect(g, GW - (hw[r] || 0) + 1, r, 15, r, "r");
    }
  },
  gem(g, s) { // ひたいのほうせき
    const y = s.top + 2;
    set(g, 15, y, "g");
    fillRect(g, 14, y + 1, 15, y + 1, "g");
    fillRect(g, 14, y + 2, 15, y + 2, "g");
    set(g, 15, y + 3, "g");
  },
  moonMark(g, s) { // まんまるおつきさま
    oval(g, 15, s.top + 3, 1, 1, "y");
    set(g, 12, s.top + 2, "y");
  },
  whiskers(g, s, hw) { // ひげ
    const y = s.eyeY + 4;
    const x = GW - hw[y];
    fillRect(g, x - 1, y, x + 1, y, "k");
    fillRect(g, x - 1, y + 3, x + 1, y + 3, "k");
  },
  cheekPads(g, s, hw) { // でんきほっぺ
    const y = s.eyeY + 5;
    const x = GW - hw[y] + 2;
    oval(g, x, y, 1, 1, "o");
  },
  noseBig(g, s) { // おおきなはな (モグラ)
    oval(g, 15, s.eyeY + 7, 2, 1, "n");
  },
  legsSide(g, s, hw) { // よこの小さなあし (クモ)
    for (const r of [s.eyeY + 8, s.eyeY + 11, s.eyeY + 14]) {
      const x = GW - (hw[r] || 2) - 1;
      oval(g, x, r, 1, 1, "a");
    }
  },
  tuft(g, s) { // ねぐせ毛
    fillRect(g, 15, s.top - 3, 15, s.top + 1, "a");
    set(g, 14, s.top - 2, "a"); set(g, 13, s.top - 1, "a");
  },
  spikeBack(g, s, hw) { // せなかのトゲ
    const ex = GW - hw[s.top + 3] + 2;
    triUp(g, ex, s.top + 2, 1, 4, "a");
    triUp(g, 11, s.top + 1, 1, 4, "a");
  },
};
function t0(s) { return s.top; }

// ---------- 顔 ----------
function drawEyes(g, spec) {
  const ex = spec.eyeX ?? 10, ey = spec.eyeY;
  if (spec.eyes === "sleepy") {
    fillRect(g, ex, ey + 3, ex + 3, ey + 3, "e");
    set(g, ex, ey + 4, "e");
    return;
  }
  const small = spec.eyes === "small";
  const w = small ? 3 : 4, h = small ? 4 : 6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const corner = (y === 0 || y === h - 1) && (x === 0 || x === w - 1);
      if (!corner) set(g, ex + x, ey + y, "e");
    }
  }
  set(g, ex + 1, ey + 1, "w");
  set(g, ex + 2, ey + 1, "w");
  set(g, ex + 1, ey + 2, "w");
  if (!small) set(g, ex + 1, ey + 3, "W");
  if (spec.fierce) {
    fillRect(g, ex - 1, ey - 2, ex + w - 1, ey - 2, "k");
    set(g, ex + w, ey - 3, "k");
  }
}

function drawMouth(g, spec) {
  const y = spec.eyeY + 7;
  switch (spec.mouth) {
    case "open":
      set(g, 14, y, "k"); set(g, 15, y, "k");
      set(g, 13, y + 1, "k"); set(g, 14, y + 1, "p"); set(g, 15, y + 1, "p");
      set(g, 14, y + 2, "k"); set(g, 15, y + 2, "k");
      break;
    case "w":
      set(g, 13, y, "k");
      set(g, 14, y + 1, "k"); set(g, 15, y + 1, "k");
      break;
    case "fang":
      set(g, 14, y, "k"); set(g, 15, y, "k"); set(g, 13, y - 1, "k");
      set(g, 13, y + 1, "w");
      break;
    case "beak":
      set(g, 14, y - 1, "o"); set(g, 15, y - 1, "o");
      set(g, 15, y, "o");
      break;
    case "none":
      break;
    default: // smile
      set(g, 13, y - 1, "k");
      set(g, 14, y, "k"); set(g, 15, y, "k");
  }
}

// ---------- 合成 ----------
const BACK_PARTS = new Set(["wingBack", "butterflyWings", "shellSide"]);
const FRONT_PARTS = new Set(["moundFront", "headband", "gem", "moonMark", "whiskers", "cheekPads", "noseBig"]);

function specToRows(spec) {
  const g = makeGrid();
  const hw = bodyWidths(spec);
  const parts = (spec.parts || []).map((p) => (Array.isArray(p) ? p[0] : p));

  // 1) 背面パーツ
  for (const n of parts) if (BACK_PARTS.has(n)) PARTS[n](g, spec, hw);
  // 2) 本体
  for (let y = spec.top; y <= spec.bottom; y++) {
    fillRect(g, GW - hw[y], y, 15, y, "a");
  }
  // 3) 手足・中間パーツ
  if (spec.arms !== false) {
    const ay = spec.eyeY + 9;
    for (let r = ay; r <= ay + 2; r++) {
      if (hw[r]) set(g, GW - hw[r] - 1, r, "a");
    }
  }
  if (spec.feet !== false) {
    fillRect(g, 7, spec.bottom + 1, 10, spec.bottom + 2, "a");
  }
  for (const n of parts) {
    if (!BACK_PARTS.has(n) && !FRONT_PARTS.has(n)) PARTS[n](g, spec, hw);
  }
  // 4) 自動アウトライン
  const fills = new Set(["a", "l", "f", "g", "z", "h", "y", "p", "v", "u", "s", "t", "r", "o", "n", "b", "d", "m"]);
  const edge = [];
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      if (!fills.has(g[y][x])) continue;
      if (at(g, x - 1, y) === "." || at(g, x + 1, y) === "." || at(g, x, y - 1) === "." || at(g, x, y + 1) === ".") {
        edge.push([x, y]);
      }
    }
  }
  for (const [x, y] of edge) g[y][x] = "k";
  // 5) おなか
  if (spec.belly !== false) {
    const bt = spec.eyeY + 9, bb = spec.bottom - 1;
    for (let y = bt; y <= bb; y++) {
      const t = (y - bt) / Math.max(1, bb - bt);
      const bwv = Math.round(Math.min(hw[y] - 2, (spec.width - 3) * Math.sin(Math.PI * (0.2 + 0.8 * t)) + 1));
      for (let x = GW - bwv; x <= 15; x++) {
        if (g[y][x] === "a") g[y][x] = "b";
      }
    }
  }
  // 6) ハイライト
  for (let y = spec.top + 1; y <= spec.top + 2; y++) {
    for (let x = GW - hw[y] + 2; x <= GW - hw[y] + 4; x++) {
      if (g[y][x] === "a") g[y][x] = "h";
    }
  }
  // 7) もよう
  for (const sp of spec.spots || []) {
    const [x, y, ch] = sp;
    if (g[y]?.[x] === "a" || g[y]?.[x] === "b") { set(g, x, y, ch); set(g, x + 1, y, ch); set(g, x, y + 1, ch); set(g, x + 1, y + 1, ch); }
  }
  // 8) 前面パーツ → 顔
  for (const n of parts) if (FRONT_PARTS.has(n)) PARTS[n](g, spec, hw);
  drawEyes(g, spec);
  drawMouth(g, spec);
  if (spec.extraEyes) {
    set(g, 9, spec.eyeY - 3, "e"); set(g, 12, spec.eyeY - 4, "e");
  }
  if (spec.blush !== false && spec.mouth !== "beak") {
    const by = spec.eyeY + 5;
    const bx = GW - hw[by] + 2;
    for (const [x, y] of [[bx, by], [bx + 1, by], [bx, by + 1], [bx + 1, by + 1]]) {
      if (g[y]?.[x] === "a" || g[y]?.[x] === "b") g[y][x] = "c";
    }
  }
  return g.map((row) => row.join(""));
}

// ---------- 共通カラー ----------
const BASE_PAL = { k: "#2a2430", e: "#2a2230", w: "#ffffff", W: "#c8e8ff", c: "#f8a8b8", p: "#f8b8c8" };

// ---------- 全50体の仕様 ----------
const SPECS = {
  // --- 御三家 ---
  leafy: { shape: "round", top: 7, bottom: 29, width: 11, eyeY: 13, mouth: "smile",
    parts: ["twinleaf"], pal: { a: "#7ed88a", h: "#b8f0b0", d: "#4aa858", b: "#eafce0", l: "#5cc44e" } },
  foresta: { shape: "square", top: 9, bottom: 29, width: 13, eyeY: 15, mouth: "open",
    parts: ["leafcap"], pal: { a: "#5cb868", h: "#a0e090", d: "#3a8a48", b: "#e0f8d0", l: "#3f9d4c", y: "#f8e04a" } },
  hinokon: { shape: "egg", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "beak",
    parts: ["flame"], pal: { a: "#ffb84d", h: "#ffe0a0", d: "#e08828", b: "#fff0d0", f: "#ff6438", g: "#ffd84d", o: "#ff8c42" } },
  goemba: { shape: "round", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["flame"], pal: { a: "#ff7a52", h: "#ffb090", d: "#d84828", b: "#ffd8a8", f: "#ff9a28", g: "#ffe14d" } },
  shizumin: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "open",
    parts: ["droplet", "finGills"], pal: { a: "#7ec4f8", h: "#c0e4ff", d: "#4890d8", b: "#e8f6ff", g: "#a0d8f0" } },
  taidarn: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "smile", fierce: true,
    parts: ["shellSide"], pal: { a: "#68aae0", h: "#a8d0f0", d: "#3878b8", b: "#dceeff", s: "#9a7848", t: "#e0c088" } },
  // --- 序盤 ---
  koronezu: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "w",
    parts: ["earRound"], pal: { a: "#e8c088", h: "#f8e0b8", d: "#c09050", b: "#fcf0d8" } },
  dotanezu: { shape: "square", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["earRound", "whiskers"], pal: { a: "#c89860", h: "#e0c090", d: "#966838", b: "#f0e0c0" } },
  pipitto: { shape: "egg", top: 9, bottom: 28, width: 10, eyeY: 13, mouth: "beak",
    parts: ["tuft", "wingNubs"], pal: { a: "#ffd866", h: "#fff0b0", d: "#e0a838", b: "#fff8dc", o: "#ff8c42", v: "#f0c050" } },
  sorahane: { shape: "egg", top: 7, bottom: 29, width: 11, eyeY: 12, mouth: "beak", fierce: true,
    parts: ["tuft", "wingBack"], pal: { a: "#e0b054", h: "#f8d890", d: "#a87830", b: "#fcf4dc", o: "#ff8c42", v: "#b8842e" } },
  kemukemu: { shape: "round", top: 12, bottom: 29, width: 13, eyeY: 16, mouth: "w",
    parts: ["fuzzTop"], pal: { a: "#b0d858", h: "#d8f098", d: "#80a830", b: "#ecf8c8", f: "#688828" } },
  choumai: { shape: "egg", top: 9, bottom: 27, width: 7, eyeY: 13, mouth: "smile", eyeX: 12,
    parts: ["butterflyWings"], pal: { a: "#f8f0dc", h: "#ffffff", d: "#d8c8a0", b: "#fffbe8", v: "#a87ae0", u: "#c8a8f0", y: "#f8d84a" } },
  // --- でんき/いわ/エスパー ---
  biribo: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "open",
    parts: ["bolt", "cheekPads"], blush: false, pal: { a: "#ffdf4d", h: "#fff4b0", d: "#e0ac20", b: "#fff8d0", z: "#ffef8a", o: "#ffa030" } },
  raigoron: { shape: "egg", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["bolt", "fuzzRing", "cheekPads"], blush: false,
    pal: { a: "#ffd028", h: "#fff090", d: "#d8a010", b: "#fff0b8", z: "#ffef8a", f: "#5878e0", o: "#ffa030" } },
  gorotan: { shape: "round", top: 9, bottom: 29, width: 11, eyeY: 14, mouth: "smile",
    parts: ["rockCrown"], pal: { a: "#b0b0a0", h: "#d8d8c8", d: "#808072", b: "#d8d8cc" },
    spots: [[6, 23, "d"], [12, 26, "d"]] },
  gansekioh: { shape: "square", top: 8, bottom: 29, width: 13, eyeY: 13, mouth: "smile", fierce: true,
    parts: ["rockCrown", "gem"], pal: { a: "#9a9a88", h: "#c4c4b0", d: "#6a6a5c", b: "#c8c8b8", g: "#7ee0f0" },
    spots: [[5, 22, "d"], [13, 26, "d"]] },
  nemuriro: { shape: "pear", top: 8, bottom: 29, width: 11, eyeY: 13, eyes: "sleepy", mouth: "w",
    parts: ["tuft"], pal: { a: "#d8bff0", h: "#f0e0ff", d: "#a888cc", b: "#f8f0ff" } },
  yumemira: { shape: "egg", top: 7, bottom: 27, width: 11, eyeY: 12, mouth: "smile", feet: false,
    parts: ["gem"], pal: { a: "#c0a0f0", h: "#e4d4ff", d: "#9068c8", b: "#f0e8ff", g: "#5ce0e8", y: "#f8e04a" },
    spots: [[6, 20, "y"], [13, 24, "y"]] },
  // --- ゴースト/かくとう ---
  hotabi: { shape: "egg", top: 9, bottom: 28, width: 10, eyeY: 14, mouth: "open", feet: false,
    parts: ["flame"], pal: { a: "#8ed0ff", h: "#d0ecff", d: "#4898e0", b: "#e8f6ff", f: "#68b8ff", g: "#e0f4ff" } },
  onibirasu: { shape: "egg", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true, feet: false,
    parts: ["flame", "hornNubs"], pal: { a: "#b8a0f8", h: "#e0d0ff", d: "#8868d0", b: "#eee8ff", f: "#9a7af0", g: "#e8e0ff", y: "#5ce0e8" } },
  kobusshi: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "smile", fierce: true,
    parts: ["headband"], pal: { a: "#f0c890", h: "#fce4c0", d: "#c89860", b: "#fcf0dc", r: "#f05840" } },
  goukender: { shape: "square", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["headband"], pal: { a: "#d8a068", h: "#f0c898", d: "#a87040", b: "#e86848", r: "#c03028" } },
  dokudama: { shape: "pear", top: 9, bottom: 29, width: 12, eyeY: 14, mouth: "open",
    parts: ["drip"], pal: { a: "#c070e0", h: "#e0a8f8", d: "#9040b8", b: "#ecd0f8", g: "#8ae05a" },
    spots: [[6, 23, "g"], [12, 26, "g"]] },
  mogurai: { shape: "round", top: 7, bottom: 26, width: 11, eyeY: 12, eyes: "small", mouth: "none",
    parts: ["noseBig", "moundFront"], pal: { a: "#a87850", h: "#c8a078", d: "#785030", b: "#e8d0b0", n: "#ff9aaa", s: "#b09058", t: "#d0b880" } },
  // --- ドラゴン ---
  tatsume: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "open",
    parts: ["hornNubs", "wingNubs"], pal: { a: "#8cb4f0", h: "#c4dcff", d: "#5880c8", b: "#e4eeff", y: "#f8d060", v: "#6890d8" } },
  ryugaoh: { shape: "egg", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["hornLong", "wingBack"], pal: { a: "#6088e0", h: "#98b8f8", d: "#3858b0", b: "#d4e2ff", y: "#f8d060", v: "#4868b8" } },
  tengenryu: { shape: "egg", top: 7, bottom: 29, width: 12, eyeY: 12, mouth: "smile",
    parts: ["antler", "finGills", "gem"], pal: { a: "#8ae8dc", h: "#d0fff6", d: "#4cb8a8", b: "#fbf8ff", g: "#f8d84a", y: "#f8e04a" },
    spots: [[6, 22, "y"], [12, 26, "y"]] },
  // ============ 追加モンスター (28-50) ============
  mokoppo: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 14, mouth: "w",
    parts: ["fuzzTop", "earRound"], pal: { a: "#f8f0e0", h: "#ffffff", d: "#d8c8a8", b: "#fffdf4", f: "#e8dcc8" } },
  mokoking: { shape: "square", top: 8, bottom: 29, width: 13, eyeY: 14, mouth: "smile", fierce: true,
    parts: ["fuzzTop", "earRound", "crownGold"], pal: { a: "#f0e4cc", h: "#fffcf0", d: "#c8b890", b: "#fffcf0", f: "#dcccb0", y: "#f8c840", z: "#f86868" } },
  hanabii: { shape: "round", top: 10, bottom: 28, width: 10, eyeY: 15, mouth: "smile",
    parts: ["flowerTop"], pal: { a: "#a0d870", h: "#ccf0a0", d: "#70a848", b: "#e8f8d0", y: "#f8d84a" } },
  furawana: { shape: "pear", top: 9, bottom: 29, width: 12, eyeY: 14, mouth: "open",
    parts: ["flowerCrown"], pal: { a: "#88c860", h: "#b8e898", d: "#589838", b: "#f0f8dc", y: "#f8d84a" } },
  kodamakko: { shape: "egg", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "w",
    parts: ["leaf1"], pal: { a: "#d8e8c0", h: "#f0f8e0", d: "#a8c088", b: "#f4fae8", l: "#68b848" },
    spots: [[7, 22, "d"], [12, 25, "d"]] },
  pukupuku: { shape: "round", top: 9, bottom: 28, width: 11, eyeY: 14, mouth: "open",
    parts: ["fuzzRing"], pal: { a: "#90d8e8", h: "#c8f0f8", d: "#58a8c0", b: "#e8f8fc", f: "#f8e070" } },
  harisuin: { shape: "round", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["fuzzRing"], pal: { a: "#78b8d8", h: "#b0e0f0", d: "#4888a8", b: "#e0f4f8", f: "#c080e8" } },
  penpeko: { shape: "egg", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "beak",
    parts: ["wingNubs"], pal: { a: "#5878a0", h: "#88a8c8", d: "#385878", b: "#f8fbff", o: "#ffa030", v: "#486890" } },
  denrisu: { shape: "round", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "w",
    parts: ["earCat", "cheekPads"], pal: { a: "#ffe066", h: "#fff4b8", d: "#e0b030", b: "#fffae0", o: "#ff9838" } },
  raikatto: { shape: "egg", top: 7, bottom: 29, width: 11, eyeY: 12, mouth: "fang", fierce: true,
    parts: ["earCat", "cheekPads", "whiskers"], pal: { a: "#ffd028", h: "#fff090", d: "#d8a010", b: "#fff4c8", o: "#ff9838" } },
  pokaguma: { shape: "round", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "w",
    parts: ["earRound"], pal: { a: "#f09858", h: "#ffc898", d: "#c86830", b: "#ffe8cc" } },
  honoguman: { shape: "square", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["earRound", "flame"], pal: { a: "#e07038", h: "#ffa070", d: "#b04818", b: "#ffd8a8", f: "#ff9a28", g: "#ffe14d" } },
  tentorin: { shape: "round", top: 9, bottom: 28, width: 10, eyeY: 14, mouth: "smile",
    parts: ["antennaBalls"], belly: false,
    pal: { a: "#f87868", h: "#ffb0a0", d: "#c84838", b: "#ffe8e0", z: "#484858" },
    spots: [[6, 22, "e"], [12, 24, "e"], [9, 26, "e"]] },
  tentogado: { shape: "square", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "smile", fierce: true,
    parts: ["antennaBalls", "rockCrown"], belly: false,
    pal: { a: "#e06858", h: "#f8a090", d: "#b03828", b: "#f8d8d0", z: "#484858", s: "#9a9a88" },
    spots: [[6, 22, "s"], [12, 25, "s"]] },
  punigumo: { shape: "round", top: 9, bottom: 28, width: 11, eyeY: 14, mouth: "w",
    parts: ["legsSide"], pal: { a: "#b088e0", h: "#d8c0f8", d: "#8058b8", b: "#e8dcf8" },
    extraEyes: true },
  nyaruma: { shape: "round", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "w",
    parts: ["earCat", "whiskers"], pal: { a: "#f8e8d0", h: "#fffaf0", d: "#d0b890", b: "#fffcf4" } },
  nyaruda: { shape: "egg", top: 7, bottom: 29, width: 11, eyeY: 12, mouth: "fang", fierce: true,
    parts: ["earCat", "whiskers"], pal: { a: "#8890a8", h: "#b8c0d0", d: "#586078", b: "#e8ecf4" } },
  fukusuke: { shape: "egg", top: 8, bottom: 29, width: 11, eyeY: 13, mouth: "beak",
    parts: ["earCat", "wingNubs"], pal: { a: "#b89068", h: "#d8b890", d: "#886040", b: "#f4ead8", o: "#ffa030", v: "#987850", p: "#d8b890" } },
  panchibi: { shape: "round", top: 8, bottom: 29, width: 10, eyeY: 13, mouth: "smile", fierce: true,
    parts: ["headband", "tuft"], pal: { a: "#f8b070", h: "#ffd8a8", d: "#d08040", b: "#ffeed8", r: "#5878e0" } },
  sheetun: { shape: "egg", top: 8, bottom: 28, width: 10, eyeY: 13, mouth: "open", feet: false,
    parts: ["tuft"], pal: { a: "#f4f4fc", h: "#ffffff", d: "#c8c8dc", b: "#fbfbff" } },
  sunagon: { shape: "square", top: 8, bottom: 29, width: 12, eyeY: 13, mouth: "fang", fierce: true,
    parts: ["hornNubs", "spikeBack"], pal: { a: "#e0c078", h: "#f4e0a8", d: "#b09048", b: "#f8ecc8", y: "#c87840" },
    spots: [[6, 22, "d"], [12, 25, "d"]] },
  yubake: { shape: "round", top: 9, bottom: 29, width: 11, eyeY: 14, eyes: "sleepy", mouth: "open", feet: false,
    parts: ["droplet"], pal: { a: "#88d8d0", h: "#c0f0e8", d: "#50a8a0", b: "#e4f8f4" } },
  tsukiusa: { shape: "egg", top: 9, bottom: 29, width: 10, eyeY: 14, mouth: "w",
    parts: ["earBunny", "moonMark"], pal: { a: "#f0ecff", h: "#ffffff", d: "#c4b8e8", b: "#fbfaff", y: "#f8d84a" } },
};

// ---------- 出力 ----------
export const MON_SPRITES = {};
for (const [id, spec] of Object.entries(SPECS)) {
  MON_SPRITES[id] = { pal: { ...BASE_PAL, ...spec.pal }, rows: specToRows(spec) };
}

// ================================================================
// 人型キャラのベース (方向: down / up / side。right は side を左右反転して描画)
// パレット差し替えで全キャラ共用: h=髪/帽子, s=肌, c=服, p=ズボン, k=輪郭, e=目
export const CHAR_BASE = {
  down: [
    "........",
    "...kkkkk",
    "..khhhhh",
    ".khhhhhh",
    ".khsssss",
    ".kssesss",
    ".kssssss",
    "..kccccc",
    ".ksccccc",
    ".ksccccc",
    "..kccccc",
    "..kppppp",
    "...kpp..",
    "...kpp..",
    "...kkk..",
    "........",
  ],
  up: [
    "........",
    "...kkkkk",
    "..khhhhh",
    ".khhhhhh",
    ".khhhhhh",
    ".khhhhhh",
    ".kshhhhh",
    "..kccccc",
    ".ksccccc",
    ".ksccccc",
    "..kccccc",
    "..kppppp",
    "...kpp..",
    "...kpp..",
    "...kkk..",
    "........",
  ],
  side: [
    "................",
    "....kkkkkkkk....",
    "...khhhhhhhhk...",
    "...khhhhhhhhk...",
    "...kshhhhhhhk...",
    "...ksesshhhhk...",
    "...ksssshhk.....",
    "....kkkkkkk.....",
    "....kcccccck....",
    "...kscccccck....",
    "...kscccccck....",
    "....kccccck.....",
    "....kpppppk.....",
    "....kppppk......",
    "....kk..kk......",
    "................",
  ],
};

// キャラごとのパレット
export const CHAR_PALS = {
  player:    { k: "#25201c", h: "#d94f2a", s: "#f5cfa0", c: "#3f68c9", p: "#4a4a5a", e: "#222222" },
  player_girl: { k: "#25201c", h: "#a3552a", s: "#f5cfa0", c: "#e8607a", p: "#3a4a6a", e: "#222222" },
  rival:     { k: "#1c2025", h: "#3a5fc0", s: "#f5cfa0", c: "#e0e0e8", p: "#333340", e: "#222222" },
  professor: { k: "#25201c", h: "#8a7a5a", s: "#f5cfa0", c: "#f0f0f0", p: "#6a5a3a", e: "#222222" },
  mom:       { k: "#25201c", h: "#a35c2a", s: "#f5cfa0", c: "#e88aa0", p: "#7a4a5a", e: "#222222" },
  boy:       { k: "#25201c", h: "#4a3520", s: "#f5cfa0", c: "#68b84a", p: "#3a4a6a", e: "#222222" },
  girl:      { k: "#25201c", h: "#7a4520", s: "#f5cfa0", c: "#e8c94c", p: "#c05a7a", e: "#222222" },
  oldman:    { k: "#25201c", h: "#cccccc", s: "#e8c9a0", c: "#6a7a5a", p: "#5a5a4a", e: "#222222" },
  nurse:     { k: "#25201c", h: "#e87ba0", s: "#f5cfa0", c: "#ffffff", p: "#e8a0b8", e: "#222222" },
  clerk:     { k: "#25201c", h: "#3a3a3a", s: "#f5cfa0", c: "#4aa0c8", p: "#3a3a4a", e: "#222222" },
  grunt:     { k: "#15121c", h: "#2c2438", s: "#e8c9a0", c: "#3a3048", p: "#241e30", e: "#c0392b" },
  boss:      { k: "#15121c", h: "#6a6a72", s: "#e8c9a0", c: "#1c1824", p: "#2c2436", e: "#c0392b" },
  leader1:   { k: "#25201c", h: "#4a8a3a", s: "#f5cfa0", c: "#7ec850", p: "#4a5a3a", e: "#222222" },
  leader2:   { k: "#25201c", h: "#2a6ab0", s: "#f5cfa0", c: "#5aa7e8", p: "#2a4a6a", e: "#222222" },
  leader3:   { k: "#25201c", h: "#c8a020", s: "#f5cfa0", c: "#f0c020", p: "#5a5a3a", e: "#222222" },
  leader4:   { k: "#25201c", h: "#5a3d8a", s: "#e8d5c0", c: "#7a5aa8", p: "#3a2c50", e: "#222222" },
  champion:  { k: "#25201c", h: "#c03028", s: "#f5cfa0", c: "#d8b830", p: "#6a2a2a", e: "#222222" },
  sage:      { k: "#25201c", h: "#e8e8e8", s: "#e8c9a0", c: "#8a5aa8", p: "#5a4a6a", e: "#222222" },
};
