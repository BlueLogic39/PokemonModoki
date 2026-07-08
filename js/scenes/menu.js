// メニュー: モンスター / バッグ / ずかん / つうしん / レポート / バッジ
import { G, popScene, pushScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import { ui } from "../engine/ui.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawHpBar, drawMonSprite, drawMonSilhouette,
  drawDarkPanel, drawTextShadow, drawBallIcon,
} from "../engine/render.js";
import { SettingsScene } from "./settings.js";
import { TrainerCardScene } from "./trainer_card.js";
import { TownMapScene } from "./townmap.js";
import { DEX, species } from "../data/dex.js";
import { moveData, moveInfo } from "../data/moves.js";
import { itemData } from "../data/items.js";
import { statsOf, isFainted, expForLevel } from "../core/monster.js";
import { saveGame } from "../core/save.js";
import { TYPE_COLORS } from "../data/types.js";
import { LinkScene } from "./link.js";

const STATUS_LABEL = { psn: "どく", par: "まひ", brn: "やけど", slp: "ねむり" };

function runSub(SceneClass, ...args) {
  return new Promise((resolve) => pushScene(new SceneClass(resolve, ...args)));
}

export class MenuScene {
  constructor() { this.overlay = true; this.closed = false; }
  enter() { this.run(); }
  async run() {
    while (!this.closed) {
      // タウンマップは 持っているときだけ メニューに出す
      const hasMap = !!G.player.flags.has_townmap;
      const items = ["モンスター", "バッグ", "ずかん"];
      if (hasMap) items.push("タウンマップ");
      items.push(G.player.name, "つうしん", "レポート", "せってい", "とじる");
      const i = await ui.ask(items, { x: SCREEN_W - 84, y: 6 });
      if (i === -1) break;
      const label = items[i];
      if (label === "とじる") break;
      else if (label === "モンスター") await runSub(PartyScene);
      else if (label === "バッグ") await runSub(BagScene);
      else if (label === "ずかん") await runSub(DexScene);
      else if (label === "タウンマップ") await runSub(TownMapScene);
      else if (label === G.player.name) await runSub(TrainerCardScene);
      else if (label === "つうしん") {
        popScene(); // メニューを閉じてから通信ルームへ
        pushScene(new LinkScene());
        return;
      }
      else if (label === "レポート") {
        const ok = saveGame(G.player);
        audio.sfx(ok ? "heal" : "bump");
        await ui.say(ok ? "レポートに しっかり かきのこした! (セーブ かんりょう)" : "セーブに しっぱいした…");
      }
      else if (label === "せってい") await runSub(SettingsScene);
    }
    popScene();
  }
  draw() { /* overlay: 下のフィールドが見えたまま */ }
}

// ---------- 手持ち ----------
export class PartyScene {
  constructor(resolve, opts = {}) {
    this.resolve = resolve;
    this.opts = opts; // {pick: true} なら選択して返すモード (通信交換用)
    this.idx = 0;
    this.busy = false;
    this.summaryMon = null;
    this.moveCursor = 0;
    this.swapFrom = -1;
  }
  update() {
    if (this.busy || ui.busy()) return;
    const party = G.player.party;
    if (this.summaryMon) {
      const nm = this.summaryMon.moves.length;
      if (input.justPressed("up")) { this.moveCursor = (this.moveCursor + nm - 1) % nm; audio.sfx("select"); }
      if (input.justPressed("down")) { this.moveCursor = (this.moveCursor + 1) % nm; audio.sfx("select"); }
      if (input.justPressed("a") || input.justPressed("b")) { audio.sfx("cancel"); this.summaryMon = null; }
      return;
    }
    if (input.justPressed("up")) { this.idx = (this.idx + party.length - 1) % party.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % party.length; audio.sfx("select"); }
    if (input.justPressed("b")) {
      if (this.swapFrom >= 0) { this.swapFrom = -1; audio.sfx("cancel"); return; }
      audio.sfx("cancel");
      popScene();
      this.resolve(-1);
      return;
    }
    if (input.justPressed("a")) {
      if (this.opts.pick) {
        audio.sfx("confirm");
        popScene();
        this.resolve(this.idx);
        return;
      }
      if (this.swapFrom >= 0) {
        const p = G.player.party;
        [p[this.swapFrom], p[this.idx]] = [p[this.idx], p[this.swapFrom]];
        this.swapFrom = -1;
        audio.sfx("confirm");
        return;
      }
      this.menu();
    }
  }
  async menu() {
    this.busy = true;
    const sel = await ui.ask(["ようすを みる", "いれかえる", "もどる"]);
    this.busy = false;
    if (sel === 0) { this.summaryMon = G.player.party[this.idx]; this.moveCursor = 0; }
    else if (sel === 1) { this.swapFrom = this.idx; audio.sfx("select"); }
  }
  draw(ctx, t) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    if (this.summaryMon) { this.drawSummary(ctx, this.summaryMon); return; }
    drawTextShadow(ctx, "てもちの モンスター", 8, 5, "#f8f8f8");
    const party = G.player.party;
    for (let i = 0; i < party.length; i++) {
      const m = party[i];
      const y = 18 + i * 23;
      drawWindow(ctx, 6, y, SCREEN_W - 12, 21);
      if (i === this.idx) {
        ctx.fillStyle = "#c03028";
        ctx.fillRect(8, y + 2, 2, 17);
      }
      if (this.swapFrom === i) drawText(ctx, "⇔", 12, y + 6, "#c03028");
      drawMonSprite(ctx, m.species, 14, y + 2, 1);
      drawText(ctx, m.name, 34, y + 2, "#303030");
      drawText(ctx, `Lv${m.level}`, 110, y + 2, "#303030");
      const st = isFainted(m) ? "ひんし" : m.status ? STATUS_LABEL[m.status] : "";
      if (st) drawText(ctx, st, 140, y + 2, "#c03028");
      drawHpBar(ctx, 34, y + 13, 90, m.curHp / statsOf(m).hp);
      drawText(ctx, `${m.curHp}/${statsOf(m).hp}`, 130, y + 11, "#505050");
    }
  }
  drawSummary(ctx, m) {
    const sp = species(m.species);
    drawWindow(ctx, 4, 4, SCREEN_W - 8, SCREEN_H - 8);
    drawMonSprite(ctx, m.species, 14, 14, 3);
    drawText(ctx, `${m.name}`, 70, 12, "#303030");
    drawText(ctx, `Lv${m.level}  No.${String(sp.no).padStart(3, "0")}`, 70, 24, "#303030");
    let tx = 70;
    for (const ty of sp.types) {
      ctx.fillStyle = TYPE_COLORS[ty];
      ctx.fillRect(tx, 36, 40, 11);
      drawTextShadow(ctx, ty, tx + 3, 38, "#fff", "#00000080");
      tx += 44;
    }
    const st = statsOf(m);
    const rows = [
      ["HP", `${m.curHp}/${st.hp}`], ["こうげき", st.atk], ["ぼうぎょ", st.def],
      ["とくこう", st.spa], ["とくぼう", st.spd], ["すばやさ", st.spe],
    ];
    rows.forEach(([label, val], i) => {
      drawText(ctx, label, 132, 14 + i * 10, "#606060");
      drawText(ctx, String(val), 188, 14 + i * 10, "#303030");
    });
    const next = m.level < 100 ? expForLevel(m.level + 1) - m.exp : 0;
    drawText(ctx, `つぎのLvまで ${Math.max(0, next)}`, 132, 66, "#606060");
    if (m.ot && m.ot !== G.player.name) drawText(ctx, `おや: ${m.ot}`, 132, 120, "#8a4fc0");
    // 技リスト (↑↓で選ぶと下に くわしい せつめい)
    drawText(ctx, "わざ (↑↓でせつめい)", 12, 74, "#606060");
    if (this.moveCursor >= m.moves.length) this.moveCursor = 0;
    m.moves.forEach((mv, i) => {
      const md = moveData(mv.id);
      const y = 86 + i * 11;
      if (i === this.moveCursor) { ctx.fillStyle = "#ffe0a0"; ctx.fillRect(10, y - 1, 112, 10); }
      drawText(ctx, "▶", 10, y, i === this.moveCursor ? "#c03028" : "#ffe0a0");
      ctx.fillStyle = TYPE_COLORS[md.type];
      ctx.fillRect(18, y + 1, 6, 6);
      drawText(ctx, md.name, 28, y, "#303030");
      drawText(ctx, `${mv.pp}/${md.pp}`, 96, y, "#808080");
    });
    // 選択中の技の詳細
    const cur = m.moves[this.moveCursor];
    if (cur) {
      drawWindow(ctx, 8, 132, SCREEN_W - 16, 22);
      const info = moveInfo(cur.id).split("\n");
      drawText(ctx, info[0], 14, 135, "#303030");
      drawText(ctx, info[1] || "", 14, 145, "#505050");
    }
  }
}

// ---------- バッグ ----------
export class BagScene {
  constructor(resolve) {
    this.resolve = resolve;
    this.idx = 0;
    this.busy = false;
  }
  items() {
    return Object.keys(G.player.bag).filter((id) => G.player.bag[id] > 0);
  }
  update() {
    if (this.busy || ui.busy()) return;
    const ids = this.items();
    if (input.justPressed("b")) { audio.sfx("cancel"); popScene(); this.resolve(); return; }
    if (ids.length === 0) return;
    if (this.idx >= ids.length) this.idx = ids.length - 1;
    if (input.justPressed("up")) { this.idx = (this.idx + ids.length - 1) % ids.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % ids.length; audio.sfx("select"); }
    if (input.justPressed("a")) this.useFlow(ids[this.idx]);
  }
  async useFlow(id) {
    this.busy = true;
    try {
      const it = itemData(id);
      const sel = await ui.ask(["つかう", "やめる"]);
      if (sel !== 0) return;
      if (it.effect.ball) { await ui.say("バトルちゅうに つかう どうぐだ。"); return; }
      const party = G.player.party;
      const ti = await ui.ask(party.map((m) => `${m.name} HP${m.curHp}/${statsOf(m).hp}`));
      if (ti === -1) return;
      const target = party[ti];
      const fx = it.effect;
      if (fx.revive) {
        if (!isFainted(target)) { await ui.say("げんきな モンスターには つかえない!"); return; }
        target.curHp = Math.max(1, Math.floor(statsOf(target).hp * fx.revive));
        audio.sfx("heal");
        await ui.say(`${target.name}は めを さました!`);
      } else if (fx.heal) {
        if (isFainted(target)) { await ui.say("ひんしの モンスターには きかない…"); return; }
        if (target.curHp >= statsOf(target).hp) { await ui.say("HPは まんたんだ!"); return; }
        target.curHp = Math.min(statsOf(target).hp, target.curHp + fx.heal);
        audio.sfx("heal");
        await ui.say(`${target.name}の HPが かいふくした!`);
      } else if (fx.cure) {
        if (!target.status || !fx.cure.includes(target.status)) { await ui.say("こうかが なさそうだ…"); return; }
        target.status = null;
        audio.sfx("heal");
        await ui.say(`${target.name}は げんきに なった!`);
      }
      G.player.bag[id]--;
      if (G.player.bag[id] <= 0) delete G.player.bag[id];
    } finally {
      this.busy = false;
    }
  }
  draw(ctx) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    drawTextShadow(ctx, `バッグ   おかね ${G.player.money}円`, 8, 5, "#f8f8f8");
    const ids = this.items();
    drawWindow(ctx, 6, 18, SCREEN_W - 12, 96);
    if (ids.length === 0) {
      drawText(ctx, "なにも もっていない", 16, 30, "#808080");
    }
    const top = Math.max(0, Math.min(this.idx - 3, ids.length - 7));
    for (let r = 0; r < Math.min(7, ids.length); r++) {
      const i = top + r;
      const id = ids[i];
      const y = 24 + r * 12;
      if (i === this.idx) drawText(ctx, "▶", 12, y, "#c03028");
      drawText(ctx, itemData(id).name, 24, y, "#303030");
      drawText(ctx, `x${G.player.bag[id]}`, 150, y, "#606060");
    }
    drawWindow(ctx, 6, 116, SCREEN_W - 12, 40);
    if (ids[this.idx]) {
      const desc = itemData(ids[this.idx]).desc;
      drawText(ctx, desc.slice(0, 26), 12, 122, "#303030");
      if (desc.length > 26) drawText(ctx, desc.slice(26), 12, 134, "#303030");
    }
  }
}

// ---------- ずかん ----------
export class DexScene {
  constructor(resolve) {
    this.resolve = resolve;
    this.idx = 0;
    this.busy = false;
  }
  update() {
    if (this.busy || ui.busy()) return;
    if (input.justPressed("b")) { audio.sfx("cancel"); popScene(); this.resolve(); return; }
    if (input.justPressed("up")) { this.idx = (this.idx + DEX.length - 1) % DEX.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % DEX.length; audio.sfx("select"); }
    if (input.justPressed("a")) {
      const sp = DEX[this.idx];
      if (G.player.dexSeen[sp.id]) {
        this.busy = true;
        ui.say(sp.desc).then(() => { this.busy = false; });
      }
    }
  }
  draw(ctx) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    const seen = Object.keys(G.player.dexSeen).length;
    const caught = Object.keys(G.player.dexCaught).length;
    drawTextShadow(ctx, `モンスターずかん  みつけた ${seen} / つかまえた ${caught}`, 8, 5, "#f8f8f8");
    drawWindow(ctx, 6, 18, 130, 136);
    const top = Math.max(0, Math.min(this.idx - 5, DEX.length - 11));
    for (let r = 0; r < 11; r++) {
      const i = top + r;
      if (i >= DEX.length) break;
      const sp = DEX[i];
      const y = 24 + r * 12;
      if (i === this.idx) drawText(ctx, "▶", 10, y, "#c03028");
      const known = G.player.dexSeen[sp.id];
      drawText(ctx, `No.${String(sp.no).padStart(3, "0")}`, 20, y, "#808080");
      drawText(ctx, known ? sp.name : "?????", 62, y, known ? "#303030" : "#a0a0a0");
      if (G.player.dexCaught[sp.id]) drawBallIcon(ctx, 122, y + 1);
    }
    // 右パネル
    drawWindow(ctx, 140, 18, 94, 136);
    const sp = DEX[this.idx];
    if (G.player.dexSeen[sp.id]) {
      drawMonSprite(ctx, sp.id, 163, 26, 3);
      drawText(ctx, sp.name, 152, 78, "#303030");
      let ty = 90;
      for (const tname of sp.types) {
        ctx.fillStyle = TYPE_COLORS[tname];
        ctx.fillRect(152, ty, 44, 11);
        drawTextShadow(ctx, tname, 155, ty + 2, "#fff", "#00000080");
        ty += 13;
      }
      drawText(ctx, "Aで せつめい", 152, 138, "#808080");
    } else {
      drawMonSilhouette(ctx, sp.id, 163, 26, 3);
      drawText(ctx, "?????", 152, 78, "#a0a0a0");
    }
  }
}
