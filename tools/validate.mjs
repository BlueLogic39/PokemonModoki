// データ整合性チェック: node tools/validate.mjs
import { MAPS } from "../js/data/maps.js";
import { DEX, species } from "../js/data/dex.js";
import { MOVES } from "../js/data/moves.js";
import { MON_SPRITES, CHAR_PALS } from "../js/data/sprites.js";
import { ITEMS } from "../js/data/items.js";
import { SCRIPTS } from "../js/data/events.js";
import { TYPES, typeMultiplier } from "../js/data/types.js";

let errors = 0;
const err = (msg) => { errors++; console.error("NG:", msg); };

const KNOWN_TILES = new Set([".", "p", "s", "~", "G", "T", "W", "F", "S", "R", "r", "B", "D", "m", "c", "o", "_", "M", "x", "w", "C", "P", "H", "K", "X", "b", "d", "J", "g"]);
const SOLID = new Set(["T", "W", "F", "S", "R", "r", "B", "m", "o", "w", "C", "P", "H", "K", "X", "b", "J", "_"]);

// ---- 技 ----
for (const [id, mv] of Object.entries(MOVES)) {
  if (!TYPES.includes(mv.type)) err(`move ${id}: 不明タイプ ${mv.type}`);
  if (!["phys", "spec", "stat"].includes(mv.cat)) err(`move ${id}: cat`);
}

// ---- 図鑑 ----
for (const sp of DEX) {
  for (const t of sp.types) if (!TYPES.includes(t)) err(`dex ${sp.id}: 不明タイプ ${t}`);
  for (const [lv, m] of sp.learnset) if (!MOVES[m]) err(`dex ${sp.id}: 不明わざ ${m} (Lv${lv})`);
  if (sp.evolve && !DEX.some((s) => s.id === sp.evolve.to)) err(`dex ${sp.id}: 進化先 ${sp.evolve.to} なし`);
  if (!MON_SPRITES[sp.id]) err(`dex ${sp.id}: スプライトなし`);
  const lvl1 = sp.learnset.filter(([lv]) => lv <= 5);
  if (lvl1.length === 0) err(`dex ${sp.id}: Lv5までに覚える技がない`);
}

// ---- スプライト (16x16 または 32x32) ----
for (const [id, def] of Object.entries(MON_SPRITES)) {
  const size = def.rows.length;
  if (size !== 16 && size !== 32) err(`sprite ${id}: 行数 ${size}`);
  def.rows.forEach((row, i) => {
    if (row.length !== size / 2 && row.length !== size) err(`sprite ${id} 行${i}: 長さ ${row.length} (期待 ${size / 2} か ${size})`);
    for (const ch of row) {
      if (ch !== "." && !def.pal[ch]) err(`sprite ${id} 行${i}: パレットにない文字 '${ch}'`);
    }
  });
  for (const [k, v] of Object.entries(def.pal)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) err(`sprite ${id}: 色 ${k}=${v}`);
  }
}

// ---- マップ ----
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.tiles[0].length, h = m.tiles.length;
  m.tiles.forEach((row, y) => {
    if (row.length !== w) err(`map ${id} 行${y}: 幅 ${row.length} != ${w}`);
    for (const ch of row) if (!KNOWN_TILES.has(ch)) err(`map ${id} 行${y}: 不明タイル '${ch}'`);
  });
  for (const wp of m.warps || []) {
    if (!MAPS[wp.to]) { err(`map ${id}: ワープ先マップ ${wp.to} なし`); continue; }
    if (wp.x < 0 || wp.y < 0 || wp.x >= w || wp.y >= h) err(`map ${id}: ワープ元座標 (${wp.x},${wp.y}) 範囲外`);
    const dest = MAPS[wp.to];
    const dw = dest.tiles[0].length, dh = dest.tiles.length;
    if (wp.tx < 0 || wp.ty < 0 || wp.tx >= dw || wp.ty >= dh) {
      err(`map ${id} -> ${wp.to}: ワープ先座標 (${wp.tx},${wp.ty}) 範囲外`);
    } else {
      const ch = dest.tiles[wp.ty][wp.tx];
      if (SOLID.has(ch)) err(`map ${id} -> ${wp.to}: ワープ先 (${wp.tx},${wp.ty}) が通行不可タイル '${ch}'`);
    }
  }
  for (const n of m.npcs || []) {
    if (n.x < 0 || n.y < 0 || n.x >= w || n.y >= h) err(`map ${id} npc ${n.id}: 座標範囲外`);
    else {
      const ch = m.tiles[n.y][n.x];
      if (SOLID.has(ch)) err(`map ${id} npc ${n.id}: 通行不可タイル '${ch}' の上にいる`);
    }
    if (n.pal && !CHAR_PALS[n.pal]) err(`map ${id} npc ${n.id}: 不明パレット ${n.pal}`);
    if (n.mon && !MON_SPRITES[n.mon]) err(`map ${id} npc ${n.id}: 不明モンスター ${n.mon}`);
    if (n.script && !SCRIPTS[n.script]) err(`map ${id} npc ${n.id}: 不明スクリプト ${n.script}`);
    if (n.shop) for (const it of n.shop) if (!ITEMS[it]) err(`map ${id} npc ${n.id}: 不明アイテム ${it}`);
    if (n.trainer) {
      for (const [sp, lv] of n.trainer.party) {
        try { species(sp); } catch { err(`map ${id} trainer ${n.id}: 不明種族 ${sp}`); }
        if (lv < 1 || lv > 100) err(`map ${id} trainer ${n.id}: レベル ${lv}`);
      }
      if (!n.trainer.flag) err(`map ${id} trainer ${n.id}: flagなし`);
    }
  }
  for (const tr of m.triggers || []) {
    if (!SCRIPTS[tr.script]) err(`map ${id} trigger: 不明スクリプト ${tr.script}`);
    if (tr.x < 0 || tr.y < 0 || tr.x >= w || tr.y >= h) err(`map ${id} trigger ${tr.script}: 座標範囲外`);
  }
  if (m.encounters) {
    for (const [sp, min, max, weight] of m.encounters.table) {
      try { species(sp); } catch { err(`map ${id} encounter: 不明種族 ${sp}`); }
      if (min > max) err(`map ${id} encounter ${sp}: min>max`);
      if (!(weight > 0)) err(`map ${id} encounter ${sp}: weight`);
    }
  }
}

// ---- タイプ相性の軽い検算 ----
if (typeMultiplier("でんき", ["じめん"]) !== 0) err("相性: でんき→じめん が 0 でない");
if (typeMultiplier("みず", ["ほのお"]) !== 2) err("相性: みず→ほのお が 2 でない");
if (typeMultiplier("ノーマル", ["ゴースト"]) !== 0) err("相性: ノーマル→ゴースト が 0 でない");

console.log(errors === 0 ? "OK: すべての検証に合格!" : `検証エラー ${errors}件`);
process.exit(errors ? 1 : 0);
