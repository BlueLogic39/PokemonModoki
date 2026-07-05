// トレーナーカード: 名前・ID・所持金・バッジ・ずかん・プレイ時間
import { G, popScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawTextShadow, charSpriteCanvas,
} from "../engine/render.js";

const BADGES = [
  { name: "フォレスト", color: "#58a848" },
  { name: "マリン", color: "#4a90d9" },
  { name: "ボルト", color: "#e8b820" },
  { name: "ゴースト", color: "#8a5ac0" },
];

export class TrainerCardScene {
  constructor(resolve) {
    this.resolve = resolve;
  }
  update() {
    if (input.justPressed("b") || input.justPressed("a")) {
      audio.sfx("cancel");
      popScene();
      this.resolve?.();
    }
  }
  draw(ctx, t) {
    const p = G.player;
    // 背景
    ctx.fillStyle = "#1c2030";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // カード本体 (性別で色が変わる)
    const isGirl = p.gender === "girl";
    const grad = ctx.createLinearGradient(0, 14, 0, SCREEN_H - 14);
    grad.addColorStop(0, isGirl ? "#e88aa8" : "#5a8ad8");
    grad.addColorStop(1, isGirl ? "#c05a80" : "#3a5aa8");
    ctx.fillStyle = "#f0e8d0";
    ctx.fillRect(8, 12, SCREEN_W - 16, SCREEN_H - 24);
    ctx.fillStyle = grad;
    ctx.fillRect(10, 14, SCREEN_W - 20, SCREEN_H - 28);
    // 上帯
    ctx.fillStyle = "#00000030";
    ctx.fillRect(10, 14, SCREEN_W - 20, 16);
    drawTextShadow(ctx, "トレーナーカード", 16, 18, "#f8f0d0", "#00000080");
    drawTextShadow(ctx, `IDNo. ${p.tid}`, 168, 18, "#f8f0d0", "#00000080");

    // 名前と情報
    ctx.font = 'bold 11px "MS Gothic", monospace';
    ctx.textBaseline = "top";
    ctx.fillStyle = "#00000060";
    ctx.fillText(p.name, 21, 39);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(p.name, 20, 38);

    const hours = Math.floor(p.playSec / 3600);
    const mins = Math.floor(p.playSec / 60) % 60;
    const seen = Object.keys(p.dexSeen).length;
    const caught = Object.keys(p.dexCaught).length;
    const rows = [
      ["おかね", `${p.money}円`],
      ["ずかん", `みつけた ${seen} / つかまえた ${caught}`],
      ["じかん", `${hours}じかん ${mins}ふん`],
    ];
    rows.forEach(([label, val], i) => {
      const y = 58 + i * 15;
      drawTextShadow(ctx, label, 20, y, "#e8e0c0", "#00000060");
      drawTextShadow(ctx, val, 62, y, "#ffffff", "#00000060");
    });

    // 主人公の姿 (32x32ドットを大きく表示)
    const pal = isGirl ? "player_girl" : "player";
    const cv = charSpriteCanvas(pal, "down");
    ctx.fillStyle = "#ffffff40";
    ctx.fillRect(178, 40, 48, 48);
    ctx.drawImage(cv, 178, 38, 48, 48);

    // チャンピオンの証
    if (p.flags.champion_beaten) {
      drawTextShadow(ctx, "★チャンピオン★", 158, 92, "#f8d030", "#00000080");
    }

    // バッジ (2列×2行)
    drawTextShadow(ctx, `バッジ ${p.badges.length}こ`, 20, 103, "#e8e0c0", "#00000060");
    BADGES.forEach((b, i) => {
      const has = i < p.badges.length;
      const x = 20 + (i % 2) * 106;
      const y = 115 + Math.floor(i / 2) * 15;
      // ひし形バッジ
      ctx.beginPath();
      ctx.moveTo(x + 6, y); ctx.lineTo(x + 12, y + 6); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x, y + 6);
      ctx.closePath();
      ctx.fillStyle = has ? b.color : "#00000040";
      ctx.fill();
      if (has) {
        ctx.fillStyle = "#ffffff80";
        ctx.fillRect(x + 4, y + 3, 2, 2);
      }
      drawTextShadow(ctx, has ? b.name + "バッジ" : "?????", x + 16, y + 2, has ? "#ffffff" : "#d0d0d090", "#00000060");
    });

    drawTextShadow(ctx, "Z/X: とじる", SCREEN_W - 70, SCREEN_H - 12, "#a0a8c8", "#00000080");
  }
}
