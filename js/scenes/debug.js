// デバッグモード (F2で開く)
// 全モンスターのギャラリー閲覧 + 開発用チート
import { G, popScene, markCaught } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import { ui } from "../engine/ui.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawDarkPanel, drawTextShadow, drawMonSprite,
} from "../engine/render.js";
import { DEX } from "../data/dex.js";
import { TYPE_COLORS } from "../data/types.js";
import { makeMon, healMon } from "../core/monster.js";

const MENU = [
  "モンスターギャラリー",
  "ずかんを ぜんぶ うめる",
  "おかね +100000",
  "バッジを ぜんぶ もらう",
  "てもちを ぜんかいふく",
  "とじる",
];

export class DebugScene {
  constructor() {
    this.mode = "menu"; // menu | gallery
    this.idx = 0;
    this.galIdx = 0;
    this.busy = false;
  }

  update() {
    if (this.busy || ui.busy()) return;
    if (this.mode === "menu") this.updateMenu();
    else this.updateGallery();
  }

  updateMenu() {
    if (input.justPressed("up")) { this.idx = (this.idx + MENU.length - 1) % MENU.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % MENU.length; audio.sfx("select"); }
    if (input.justPressed("b") || input.justPressed("debug")) { audio.sfx("cancel"); popScene(); return; }
    if (!input.justPressed("a")) return;
    audio.sfx("confirm");
    const i = this.idx;
    if (i === 0) { this.mode = "gallery"; return; }
    if (i === 5) { popScene(); return; }
    this.runAction(async () => {
      if (!G.player) { await ui.say("ゲームを はじめてから つかってね!"); return; }
      if (i === 1) {
        for (const sp of DEX) { G.player.dexSeen[sp.id] = true; G.player.dexCaught[sp.id] = true; }
        audio.sfx("heal");
        await ui.say("ずかんを コンプリートした! (27/27)");
      } else if (i === 2) {
        G.player.money += 100000;
        audio.sfx("confirm");
        await ui.say(`おかねを 100000円 てにいれた! (いま ${G.player.money}円)`);
      } else if (i === 3) {
        G.player.badges = ["フォレストバッジ", "マリンバッジ", "ボルトバッジ", "ゴーストバッジ"];
        G.player.flags.badge1 = G.player.flags.badge2 = G.player.flags.badge3 = G.player.flags.badge4 = true;
        audio.sfx("badge");
        await ui.say("バッジを 4つ てにいれた!");
      } else if (i === 4) {
        for (const m of G.player.party) healMon(m);
        audio.sfx("heal");
        await ui.say("てもちの モンスターが ぜんかいふくした!");
      }
    });
  }

  updateGallery() {
    const n = DEX.length;
    if (input.justPressed("left")) { this.galIdx = (this.galIdx + n - 1) % n; audio.sfx("select"); }
    if (input.justPressed("right")) { this.galIdx = (this.galIdx + 1) % n; audio.sfx("select"); }
    if (input.justPressed("up")) { this.galIdx = (this.galIdx + n - 5) % n; audio.sfx("select"); }
    if (input.justPressed("down")) { this.galIdx = (this.galIdx + 5) % n; audio.sfx("select"); }
    if (input.justPressed("b")) { audio.sfx("cancel"); this.mode = "menu"; return; }
    if (input.justPressed("a")) this.runAction(() => this.giveFlow());
  }

  async giveFlow() {
    const sp = DEX[this.galIdx];
    if (!G.player) { await ui.say("ゲームを はじめてから つかってね!"); return; }
    const ok = await ui.confirm(`${sp.name}を てもちに くわえますか?`);
    if (!ok) return;
    const levels = [5, 15, 30, 50];
    const li = await ui.ask(levels.map((l) => `Lv${l}`));
    if (li === -1) return;
    const mon = makeMon(sp.id, levels[li]);
    mon.ot = G.player.name;
    markCaught(sp.id);
    if (G.player.party.length < 6) {
      G.player.party.push(mon);
      audio.sfx("caught");
      await ui.say(`${sp.name} (Lv${levels[li]}) が てもちに くわわった!`);
    } else {
      G.player.box.push(mon);
      audio.sfx("caught");
      await ui.say(`てもちが いっぱいなので ${sp.name}は ボックスに おくった!`);
    }
  }

  async runAction(fn) {
    this.busy = true;
    try { await fn(); } finally { this.busy = false; }
  }

  // ---------- 描画 ----------
  draw(ctx, t) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    if (this.mode === "menu") {
      drawTextShadow(ctx, "★ デバッグモード ★ (F2/Xで とじる)", 8, 8, "#7ee0a0");
      drawWindow(ctx, 24, 26, 192, MENU.length * 14 + 12);
      MENU.forEach((label, i) => {
        const y = 33 + i * 14;
        if (i === this.idx) drawText(ctx, "▶", 30, y, "#c03028");
        drawText(ctx, label, 42, y, "#303030");
      });
      drawTextShadow(ctx, "※ セーブすると チートも きろくされます", 8, SCREEN_H - 12, "#a0a8c8", "#00000080");
      return;
    }
    // ギャラリー
    const sp = DEX[this.galIdx];
    drawTextShadow(ctx, `モンスターギャラリー  No.${String(sp.no).padStart(3, "0")} (${this.galIdx + 1}/${DEX.length})`, 8, 6, "#7ee0a0");
    // スプライト
    drawWindow(ctx, 8, 20, 82, 84);
    drawMonSprite(ctx, sp.id, 17, 28, 4);
    // 情報
    drawWindow(ctx, 94, 20, 138, 84);
    drawText(ctx, sp.name, 100, 25, "#303030");
    let tx = 100;
    for (const ty of sp.types) {
      ctx.fillStyle = TYPE_COLORS[ty];
      ctx.fillRect(tx, 37, 42, 10);
      drawTextShadow(ctx, ty, tx + 3, 38, "#fff", "#00000080");
      tx += 46;
    }
    const st = sp.base;
    const rows = [
      ["HP", st.hp], ["こうげき", st.atk], ["ぼうぎょ", st.def],
      ["とくこう", st.spa], ["とくぼう", st.spd], ["すばやさ", st.spe],
    ];
    rows.forEach(([label, val], i) => {
      const col = i % 2, row = (i / 2) | 0;
      const x = 100 + col * 66, y = 52 + row * 12;
      drawText(ctx, label, x, y, "#606060");
      drawText(ctx, String(val), x + 44, y, "#303030");
    });
    const evo = sp.evolve ? `Lv${sp.evolve.level}で しんか` : "しんかしない";
    drawText(ctx, evo, 100, 90, "#8a4fc0");
    // 説明
    drawWindow(ctx, 8, 108, SCREEN_W - 16, 34);
    drawText(ctx, sp.desc.slice(0, 26), 14, 114, "#303030");
    if (sp.desc.length > 26) drawText(ctx, sp.desc.slice(26, 52), 14, 126, "#303030");
    drawTextShadow(ctx, "←→↑↓:きりかえ  Z:てもちにもらう  X:もどる", 8, SCREEN_H - 12, "#a0a8c8", "#00000080");
  }
}
