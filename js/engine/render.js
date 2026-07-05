// 描画ヘルパー: タイル・スプライト・テキスト・ウィンドウ
import { MON_SPRITES, CHAR_BASE, CHAR_PALS } from "../data/sprites.js";

export const TILE = 16;
export const SCREEN_W = 240;
export const SCREEN_H = 160;

export const FONT = '8px "MS Gothic", "Yu Gothic", monospace';

// ---------- テキスト ----------
export function drawText(ctx, text, x, y, color = "#303030") {
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
export function drawTextShadow(ctx, text, x, y, color = "#f8f8f8", shadow = "#30303080") {
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = shadow;
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
export function textWidth(ctx, text) {
  ctx.font = FONT;
  return ctx.measureText(text).width;
}

// ---------- ウィンドウ ----------
export function drawWindow(ctx, x, y, w, h) {
  ctx.fillStyle = "#404870";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = "#a0a8c0";
  ctx.fillRect(x + 2, y + 2, w - 4, 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 2, y + 3, w - 4, h - 6);
}
export function drawDarkPanel(ctx, x, y, w, h) {
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#283048";
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

// ---------- HPバー ----------
export function drawHpBar(ctx, x, y, w, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = "#404040";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(x + 1, y + 1, w - 2, 2);
  const col = ratio > 0.5 ? "#58c858" : ratio > 0.2 ? "#e8b820" : "#e05038";
  ctx.fillStyle = col;
  if (ratio > 0) ctx.fillRect(x + 1, y + 1, Math.max(1, Math.round((w - 2) * ratio)), 2);
}

// ---------- スプライト ----------
const spriteCache = new Map();

function renderPixelRows(rows, pal, scale) {
  const cv = document.createElement("canvas");
  cv.width = 16 * scale; cv.height = 16 * scale;
  const c = cv.getContext("2d");
  for (let ry = 0; ry < rows.length && ry < 16; ry++) {
    const row = rows[ry];
    let full;
    if (row.length === 8) full = row + row.split("").reverse().join("");
    else full = row;
    for (let rx = 0; rx < 16; rx++) {
      const ch = full[rx];
      if (!ch || ch === ".") continue;
      const col = pal[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(rx * scale, ry * scale, scale, scale);
    }
  }
  return cv;
}

export function monSpriteCanvas(speciesId, scale = 1) {
  const key = "mon:" + speciesId + ":" + scale;
  if (!spriteCache.has(key)) {
    const def = MON_SPRITES[speciesId];
    if (!def) throw new Error("no sprite: " + speciesId);
    spriteCache.set(key, renderPixelRows(def.rows, def.pal, scale));
  }
  return spriteCache.get(key);
}
export function drawMonSprite(ctx, speciesId, x, y, scale = 1) {
  ctx.drawImage(monSpriteCanvas(speciesId, scale), Math.round(x), Math.round(y));
}
// シルエット (図鑑未登録・登場演出用)
export function monSilhouette(speciesId, scale = 1, color = "#283048") {
  const key = "sil:" + speciesId + ":" + scale + color;
  if (!spriteCache.has(key)) {
    const def = MON_SPRITES[speciesId];
    const pal = {};
    for (const k of Object.keys(def.pal)) pal[k] = color;
    spriteCache.set(key, renderPixelRows(def.rows, pal, scale));
  }
  return spriteCache.get(key);
}

export function charSpriteCanvas(palName, dir) {
  const key = "chr:" + palName + ":" + dir;
  if (!spriteCache.has(key)) {
    const pal = CHAR_PALS[palName] || CHAR_PALS.boy;
    let rows, flip = false;
    if (dir === "down") rows = CHAR_BASE.down;
    else if (dir === "up") rows = CHAR_BASE.up;
    else { rows = CHAR_BASE.side; flip = dir === "right"; }
    let cv = renderPixelRows(rows, pal, 1);
    if (flip) {
      const f = document.createElement("canvas");
      f.width = cv.width; f.height = cv.height;
      const fc = f.getContext("2d");
      fc.translate(cv.width, 0); fc.scale(-1, 1);
      fc.drawImage(cv, 0, 0);
      cv = f;
    }
    spriteCache.set(key, cv);
  }
  return spriteCache.get(key);
}
export function drawChar(ctx, palName, dir, x, y, bob = 0) {
  ctx.drawImage(charSpriteCanvas(palName, dir), Math.round(x), Math.round(y - 2 - bob));
}

// ---------- ボールアイコン ----------
export function drawBallIcon(ctx, x, y, state = "ok") {
  // state: ok(元気) / fnt(ひんし) / st(状態異常)
  const top = state === "fnt" ? "#8a8a8a" : state === "st" ? "#c8a020" : "#e05038";
  ctx.fillStyle = "#303030";
  ctx.fillRect(x, y + 1, 6, 4);
  ctx.fillRect(x + 1, y, 4, 6);
  ctx.fillStyle = top;
  ctx.fillRect(x + 1, y + 1, 4, 2);
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(x + 1, y + 3, 4, 2);
}

// ---------- タイル ----------
// 疑似乱数 (座標から装飾のゆらぎを作る)
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function drawTileAt(ctx, ch, tx, ty, px, py, t) {
  const T = TILE;
  switch (ch) {
    case ".": { // 草原
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      const r = hash2(tx, ty);
      if (r > 0.75) {
        ctx.fillStyle = "#7bb852";
        ctx.fillRect(px + 3 + Math.floor(r * 8), py + 4 + Math.floor(r * 6), 2, 2);
        ctx.fillRect(px + 10 - Math.floor(r * 6), py + 11, 2, 2);
      }
      break;
    }
    case "G": { // 草むら (エンカウント)
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#4e9a3d";
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          const gx = px + 1 + i * 4, gy = py + 3 + j * 7;
          ctx.fillRect(gx, gy + 2, 3, 4);
          ctx.fillRect(gx + 1, gy, 1, 2);
        }
      }
      ctx.fillStyle = "#3d7a30";
      ctx.fillRect(px + 3, py + 9, 1, 3);
      ctx.fillRect(px + 9, py + 4, 1, 3);
      break;
    }
    case "p": { // 道
      ctx.fillStyle = "#dcc689";
      ctx.fillRect(px, py, T, T);
      const r = hash2(tx, ty);
      if (r > 0.7) {
        ctx.fillStyle = "#c9b378";
        ctx.fillRect(px + Math.floor(r * 10), py + Math.floor(r * 12), 3, 2);
      }
      break;
    }
    case "s": { // 砂
      ctx.fillStyle = "#e8dca8";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#d8c890";
      if (hash2(tx, ty) > 0.6) ctx.fillRect(px + 4, py + 8, 4, 2);
      break;
    }
    case "~": { // 花
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      const r = hash2(tx, ty);
      const cols = ["#f06868", "#f0e058", "#f8f8f8"];
      ctx.fillStyle = cols[Math.floor(r * 3)];
      ctx.fillRect(px + 3, py + 4, 3, 3);
      ctx.fillStyle = cols[Math.floor(r * 3 + 1) % 3];
      ctx.fillRect(px + 10, py + 9, 3, 3);
      ctx.fillStyle = "#4e9a3d";
      ctx.fillRect(px + 4, py + 7, 1, 3);
      ctx.fillRect(px + 11, py + 12, 1, 2);
      break;
    }
    case "T": { // 木
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(px + 6, py + 10, 4, 5);
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(px + 2, py + 3, 12, 8);
      ctx.fillRect(px + 4, py + 1, 8, 3);
      ctx.fillStyle = "#3f9d4c";
      ctx.fillRect(px + 3, py + 4, 5, 3);
      ctx.fillRect(px + 5, py + 2, 4, 2);
      break;
    }
    case "W": { // 水 (アニメーション)
      ctx.fillStyle = "#4a90d9";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#6db3f2";
      const ph = Math.floor(t / 400 + hash2(tx, ty) * 4) % 4;
      ctx.fillRect(px + 2, py + 3 + ph, 5, 1);
      ctx.fillRect(px + 9, py + 10 - ph, 5, 1);
      break;
    }
    case "F": { // 柵
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#a87b48";
      ctx.fillRect(px, py + 6, T, 3);
      ctx.fillRect(px + 2, py + 3, 3, 10);
      ctx.fillRect(px + 11, py + 3, 3, 10);
      ctx.fillStyle = "#7a5530";
      ctx.fillRect(px + 2, py + 3, 3, 2);
      ctx.fillRect(px + 11, py + 3, 3, 2);
      break;
    }
    case "S": { // 看板
      ctx.fillStyle = "#8ecb63";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(px + 7, py + 8, 2, 7);
      ctx.fillStyle = "#c8a060";
      ctx.fillRect(px + 2, py + 2, 12, 7);
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(px + 4, py + 4, 8, 1);
      ctx.fillRect(px + 4, py + 6, 6, 1);
      break;
    }
    case "R": case "r": { // 屋根
      ctx.fillStyle = ch === "R" ? "#d95f43" : "#4a7fd9";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = ch === "R" ? "#b8452c" : "#33619e";
      ctx.fillRect(px, py + 13, T, 3);
      ctx.fillRect(px, py + 5, T, 2);
      break;
    }
    case "B": { // 建物の壁
      ctx.fillStyle = "#e8dcc0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#c8b890";
      ctx.fillRect(px, py, T, 2);
      ctx.fillStyle = "#88c8e0";
      ctx.fillRect(px + 3, py + 5, 4, 5); // 窓
      ctx.fillRect(px + 10, py + 5, 4, 5);
      break;
    }
    case "D": { // ドア
      ctx.fillStyle = "#e8dcc0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(px + 3, py + 2, 10, 14);
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(px + 4, py + 3, 8, 12);
      ctx.fillStyle = "#f0d060";
      ctx.fillRect(px + 10, py + 9, 2, 2);
      break;
    }
    case "m": { // 岩壁
      ctx.fillStyle = "#9a8a6a";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#7a6a50";
      ctx.fillRect(px, py + 12, T, 4);
      ctx.fillRect(px + 2, py + 3, 5, 4);
      ctx.fillRect(px + 9, py + 6, 5, 4);
      ctx.fillStyle = "#b8a888";
      ctx.fillRect(px + 3, py + 2, 3, 2);
      break;
    }
    case "c": { // 洞窟の床
      ctx.fillStyle = "#5a4a3f";
      ctx.fillRect(px, py, T, T);
      if (hash2(tx, ty) > 0.7) {
        ctx.fillStyle = "#6a5a4d";
        ctx.fillRect(px + 5, py + 6, 4, 3);
      }
      break;
    }
    case "o": { // 大岩
      ctx.fillStyle = "#5a4a3f";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#8a7a62";
      ctx.fillRect(px + 2, py + 4, 12, 10);
      ctx.fillRect(px + 4, py + 2, 8, 3);
      ctx.fillStyle = "#a89878";
      ctx.fillRect(px + 4, py + 4, 4, 3);
      break;
    }
    case "_": { // 虚空
      ctx.fillStyle = "#101018";
      ctx.fillRect(px, py, T, T);
      break;
    }
    // ---- 屋内 ----
    case "M": { // 床
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#d8c8a0";
      if ((tx + ty) % 2 === 0) ctx.fillRect(px, py, T, T);
      break;
    }
    case "x": { // じゅうたん
      ctx.fillStyle = "#c85048";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#b04038";
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      break;
    }
    case "w": { // 屋内の壁
      ctx.fillStyle = "#b0a080";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#988868";
      ctx.fillRect(px, py + 12, T, 4);
      ctx.fillStyle = "#c8b898";
      ctx.fillRect(px, py, T, 3);
      break;
    }
    case "C": { // カウンター
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#a87b48";
      ctx.fillRect(px, py + 2, T, 10);
      ctx.fillStyle = "#c89a60";
      ctx.fillRect(px, py + 2, T, 3);
      break;
    }
    case "P": { // パソコン
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#606880";
      ctx.fillRect(px + 2, py + 2, 12, 10);
      ctx.fillStyle = "#88e0a0";
      ctx.fillRect(px + 4, py + 4, 8, 5);
      ctx.fillStyle = "#404860";
      ctx.fillRect(px + 5, py + 12, 6, 3);
      break;
    }
    case "H": { // 回復マシン
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#c0c8d8";
      ctx.fillRect(px + 1, py + 3, 14, 12);
      ctx.fillStyle = "#e05038";
      const blink = Math.floor(t / 500) % 2 === 0;
      ctx.fillStyle = blink ? "#e05038" : "#f8a898";
      ctx.fillRect(px + 3, py + 5, 3, 3);
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(px + 8, py + 5, 5, 6);
      break;
    }
    case "K": { // 本棚
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(px, py, T, 2);
      for (let i = 0; i < 2; i++) {
        const sy = py + 3 + i * 6;
        ctx.fillStyle = "#5a3a1a";
        ctx.fillRect(px + 1, sy, 14, 5);
        const cols = ["#c85048", "#4a7fd9", "#58c858", "#e8b820"];
        for (let b = 0; b < 4; b++) {
          ctx.fillStyle = cols[(b + i + tx) % 4];
          ctx.fillRect(px + 2 + b * 3, sy + 1, 2, 4);
        }
      }
      break;
    }
    case "X": { // テーブル
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#a87b48";
      ctx.fillRect(px + 1, py + 4, 14, 9);
      ctx.fillStyle = "#c89a60";
      ctx.fillRect(px + 1, py + 4, 14, 3);
      break;
    }
    case "b": { // ベッド
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#d05048";
      ctx.fillRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(px + 1, py + 1, 14, 5);
      break;
    }
    case "d": { // 出口マット
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#88a888";
      ctx.fillRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = "#a8c8a8";
      ctx.fillRect(px + 3, py + 3, 10, 10);
      break;
    }
    case "J": { // ジムの像
      ctx.fillStyle = "#e8d8b0";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#b8b8c0";
      ctx.fillRect(px + 4, py + 2, 8, 8);
      ctx.fillRect(px + 2, py + 10, 12, 5);
      ctx.fillStyle = "#90909a";
      ctx.fillRect(px + 5, py + 3, 3, 3);
      break;
    }
    default: {
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(px, py, T, T);
    }
  }
}

// 通行不可タイル
const SOLID = new Set(["T", "W", "F", "S", "R", "r", "B", "m", "o", "w", "C", "P", "H", "K", "X", "b", "J", "_"]);
export function isSolid(ch) {
  return SOLID.has(ch);
}
