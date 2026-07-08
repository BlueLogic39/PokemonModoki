// タウンマップ: トモシビ地方の全体図。げんざいち を点滅表示。
import { G, popScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawTextShadow, drawWindow,
} from "../engine/render.js";

// 地方の配置 (x,y は 240x160 上の座標)。kind: town/route/dungeon/special
// mapIds: このスポットに対応するマップID (現在地判定用)
const PLACES = [
  { name: "ハジメむら", x: 40, y: 128, kind: "town", mapIds: ["hajime", "player_home", "neighbor_home", "lab"] },
  { name: "1ばんどうろ", x: 40, y: 104, kind: "route", mapIds: ["route1"] },
  { name: "コモレビちょう", x: 40, y: 80, kind: "town", mapIds: ["komorebi", "center_komorebi", "shop_komorebi", "house_komorebi", "gym1"] },
  { name: "2ばんどうろ", x: 72, y: 80, kind: "route", mapIds: ["route2"] },
  { name: "イワクラどうくつ", x: 104, y: 80, kind: "dungeon", mapIds: ["iwakura"] },
  { name: "ミナトし", x: 136, y: 80, kind: "town", mapIds: ["minato", "center_minato", "shop_minato", "house_minato", "gym2"] },
  { name: "3ばんどうろ", x: 136, y: 56, kind: "route", mapIds: ["route3"] },
  { name: "ライメイちょう", x: 136, y: 32, kind: "town", mapIds: ["raimei", "center_raimei", "shop_raimei", "house_raimei", "gym3", "powerplant"] },
  { name: "4ばんどうろ", x: 168, y: 32, kind: "route", mapIds: ["route4"] },
  { name: "テンクウし", x: 200, y: 32, kind: "town", mapIds: ["tenkuu", "center_tenkuu", "shop_tenkuu", "gym4", "hideout"] },
  { name: "ほしふりのとう", x: 216, y: 56, kind: "special", mapIds: ["tower"] },
  { name: "チャンピオンロード", x: 200, y: 12, kind: "dungeon", mapIds: ["champroad", "league"] },
];

// スポット間の道 (index ペア)
const ROADS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11],
];

const KIND_COLOR = { town: "#e05038", route: "#e8c060", dungeon: "#8a8a9a", special: "#a860e0" };

export class TownMapScene {
  constructor(resolve) {
    this.resolve = resolve;
    // カーソルは現在地から開始
    this.cursor = Math.max(0, PLACES.findIndex((p) => p.mapIds.includes(G.player.map)));
  }
  update() {
    if (input.justPressed("b") || input.justPressed("a")) {
      audio.sfx("cancel"); popScene(); this.resolve?.(); return;
    }
    // 左右で近いスポットへカーソル移動
    if (input.justPressed("right") || input.justPressed("down")) { this.cursor = (this.cursor + 1) % PLACES.length; audio.sfx("select"); }
    if (input.justPressed("left") || input.justPressed("up")) { this.cursor = (this.cursor + PLACES.length - 1) % PLACES.length; audio.sfx("select"); }
  }
  draw(ctx, t) {
    // 背景 (地方らしいグラデ)
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    grad.addColorStop(0, "#8ecae6");
    grad.addColorStop(1, "#a8d8a0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // 海 (下部)
    ctx.fillStyle = "#5aa0d8";
    ctx.fillRect(0, 138, SCREEN_W, SCREEN_H - 138);
    drawTextShadow(ctx, "トモシビちほう ちず", 6, 5, "#ffffff", "#00000080");

    // 道
    ctx.strokeStyle = "#c8a860"; ctx.lineWidth = 2;
    for (const [a, b] of ROADS) {
      ctx.beginPath();
      ctx.moveTo(PLACES[a].x, PLACES[a].y);
      ctx.lineTo(PLACES[b].x, PLACES[b].y);
      ctx.stroke();
    }

    const here = G.player.map;
    // スポット
    PLACES.forEach((p, i) => {
      const isHere = p.mapIds.includes(here);
      const r = p.kind === "town" ? 4 : 3;
      ctx.fillStyle = "#303030";
      ctx.fillRect(p.x - r - 1, p.y - r - 1, (r + 1) * 2, (r + 1) * 2);
      ctx.fillStyle = KIND_COLOR[p.kind];
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      // 現在地マーカー (点滅)
      if (isHere && Math.floor(t / 300) % 2 === 0) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(p.x - 1, p.y - 9, 2, 4);
        ctx.beginPath();
        ctx.moveTo(p.x - 3, p.y - 9); ctx.lineTo(p.x + 3, p.y - 9); ctx.lineTo(p.x, p.y - 5);
        ctx.fill();
      }
      // カーソル
      if (i === this.cursor) {
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
        ctx.strokeRect(p.x - r - 3, p.y - r - 3, (r + 3) * 2, (r + 3) * 2);
      }
    });

    // 選択スポットの名前パネル
    const sel = PLACES[this.cursor];
    const isHere = sel.mapIds.includes(here);
    drawWindow(ctx, 4, SCREEN_H - 26, SCREEN_W - 8, 22);
    drawText(ctx, sel.name + (isHere ? "  ◀いまここ" : ""), 10, SCREEN_H - 20, isHere ? "#c03028" : "#303030");
    drawTextShadow(ctx, "Xで とじる", SCREEN_W - 60, 6, "#ffffff", "#00000080");
  }
}
