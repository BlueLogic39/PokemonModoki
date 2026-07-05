// ゲーム全体の状態とシーン管理
import { input } from "./engine/input.js";
import { SCREEN_W, SCREEN_H } from "./engine/render.js";
import { ui } from "./engine/ui.js";

export const G = {
  player: null,   // プレイヤーデータ (セーブ対象)
  canvas: null,
  ctx: null,
  scenes: [],     // シーンスタック (最後が最前面)
  time: 0,
};

export function newPlayer(name) {
  return {
    name,
    tid: String(10000 + Math.floor(Math.random() * 90000)),
    map: "player_home",
    x: 4, y: 5, dir: "down",
    money: 3000,
    party: [],
    box: [],
    bag: { ball1: 5, potion1: 3 },
    flags: {},
    badges: [],
    dexSeen: {}, dexCaught: {},
    playSec: 0,
  };
}

export function pushScene(s) { G.scenes.push(s); s.enter?.(); }
export function popScene() { const s = G.scenes.pop(); s?.exit?.(); }
export function replaceScene(s) {
  while (G.scenes.length) popScene();
  pushScene(s);
}
export function topScene() { return G.scenes[G.scenes.length - 1]; }

export function markSeen(speciesId) { if (G.player) G.player.dexSeen[speciesId] = true; }
export function markCaught(speciesId) {
  if (G.player) { G.player.dexSeen[speciesId] = true; G.player.dexCaught[speciesId] = true; }
}

let last = 0;
function loop(ts) {
  const dt = Math.min(50, ts - last);
  last = ts;
  G.time = ts;
  if (G.player) G.player.playSec += dt / 1000;

  const scene = topScene();
  if (scene) {
    scene.update?.(dt, ts);
    // 下のシーンも描画 (オーバーレイ用)
    const ctx = G.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    let start = G.scenes.length - 1;
    while (start > 0 && G.scenes[start].overlay) start--;
    for (let i = start; i < G.scenes.length; i++) G.scenes[i].draw?.(ctx, ts);
    ui.draw(ctx, ts);
  }
  ui.update(dt);
  input.endFrame();
  requestAnimationFrame(loop);
}

// 内部解像度の拡大率。文字を高精細に描くためのスーパーサンプリング。
// ドット絵は imageSmoothingEnabled=false のままなので今まで通りカクカクを保つ。
export const SUPERSAMPLE = 4;

export function startGame(canvas, firstScene) {
  G.canvas = canvas;
  // バッキングストアを SS 倍にし、座標系は 240x160 のまま使えるよう scale する
  canvas.width = SCREEN_W * SUPERSAMPLE;
  canvas.height = SCREEN_H * SUPERSAMPLE;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(SUPERSAMPLE, 0, 0, SUPERSAMPLE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  G.ctx = ctx;
  if (typeof window !== "undefined") window.__G = G; // デバッグ用
  pushScene(firstScene);
  requestAnimationFrame((ts) => { last = ts; loop(ts); });
}
