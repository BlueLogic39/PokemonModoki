// バトルシーン (演出とUI)。計算は core/battle.js が担当。
import { G, popScene, markSeen, markCaught } from "../game.js";
import { ui } from "../engine/ui.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawHpBar, drawMonSprite, drawTextShadow,
} from "../engine/render.js";
import { species } from "../data/dex.js";
import { moveData } from "../data/moves.js";
import { itemData, ITEMS } from "../data/items.js";
import { statsOf, isFainted, expForLevel, evolveMon } from "../core/monster.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STATUS_LABEL = { psn: "どく", par: "まひ", brn: "やけど", slp: "ねむり" };
const STATUS_COLOR = { psn: "#a040a0", par: "#c8a020", brn: "#e05038", slp: "#8890a8" };

function monSummary(mon) {
  return {
    species: mon.species,
    name: mon.name,
    level: mon.level,
    hp: mon.curHp,
    maxHp: statsOf(mon).hp,
    status: mon.status,
    exp: mon.exp,
  };
}

export class BattleScene {
  // opts:
  //  battle: core Battle (local/host)
  //  mode: 'local' | 'host' | 'guest'
  //  getFoeAction: async () => action   (host: 相手プレイヤーの行動を待つ)
  //  afterTurn: (events) => void        (host: ゲストへイベント送信)
  //  remote: { sendAction, nextEvents } (guest用)
  //  foeTrainer: {name, pal}  onEnd: (result) => void
  constructor(opts) {
    this.o = opts;
    this.battle = opts.battle || null;
    this.mode = opts.mode || "local";
    this.disp = { me: null, foe: null };
    this.shake = { me: 0, foe: 0 };
    this.hide = { me: false, foe: false };
    this.flash = 0;
    this.ballAnim = null;
    this.awaitingAction = false;
    this.finished = false;
  }

  enter() {
    audio.playMusic(this.o.music || "battle");
    this.run().catch((e) => console.error("battle error", e));
  }

  myParty() {
    return this.mode === "guest" ? this.o.myParty : this.battle.me.party;
  }

  async run() {
    if (this.mode !== "guest") {
      this.disp.me = monSummary(this.battle.me.mon());
      this.disp.foe = monSummary(this.battle.foe.mon());
    } else {
      this.disp.me = monSummary(this.o.myParty[this.o.myActive ?? 0]);
      this.disp.foe = this.o.foeSummary;
    }
    markSeen(this.disp.foe.species);
    this.hide.me = true; this.hide.foe = true;
    audio.sfx("encounter");
    await sleep(300);
    if (this.o.kind === "wild") {
      this.hide.foe = false;
      await this.say(`あっ! やせいの ${this.disp.foe.name}が とびだしてきた!`);
    } else {
      this.hide.foe = false;
      await this.say(`${this.o.foeTrainer?.name ?? "???"}が しょうぶを しかけてきた!`);
      await this.say(`${this.o.foeTrainer?.name}は ${this.disp.foe.name}を くりだした!`);
    }
    this.hide.me = false;
    await this.say(`いけっ! ${this.disp.me.name}!`);

    while (!this.finished) {
      if (this.mode === "guest") {
        await this.guestTurn();
      } else {
        await this.hostOrLocalTurn();
      }
    }
  }

  async hostOrLocalTurn() {
    const action = await this.chooseAction();
    let foeAction = null;
    if (this.mode === "host") {
      this.waitingMsg = "あいての こうどうを まっています…";
      foeAction = await this.o.getFoeAction();
      this.waitingMsg = null;
    }
    const events = this.battle.turn(action, foeAction);
    this.o.afterTurn?.(events);
    await this.playEvents(events);

    // 自分がひんし → 次に出すモンスターを選ぶ
    const iFainted = events.some((e) => e.t === "mustSwitch");
    if (!this.finished && iFainted) {
      const idx = await this.choosePartyMon("つぎの モンスターを えらんでください", false);
      const swEvents = this.battle.forceSwitch(idx);
      this.o.afterTurn?.(swEvents);
      await this.playEvents(swEvents);
    }

    // 相手が次のモンスターを繰り出す (ストーリーのトレーナー戦のみ)
    const willSend = events.find((e) => e.t === "foeWillSend");
    if (!this.finished && willSend) {
      let switchIdx = null;
      // 相打ちで自分もひんしだった場合は、直前に選んだばかりなので確認しない
      if (!iFainted) {
        await this.say(`${this.o.foeTrainer?.name ?? "あいて"}は ${willSend.name}を くりだそうとしている!`, false);
        if (await ui.confirm("モンスターを いれかえますか?")) {
          const idx = await this.choosePartyMon("だれに いれかえる?", true);
          if (idx !== -1) switchIdx = idx;
        }
      }
      const contEvents = this.battle.continueAfterFoeFaint(switchIdx);
      await this.playEvents(contEvents);
    }
  }

  async guestTurn() {
    const action = await this.chooseAction();
    this.o.remote.sendAction(action);
    this.waitingMsg = "あいての こうどうを まっています…";
    const events = await this.o.remote.nextEvents();
    this.waitingMsg = null;
    await this.playEvents(events, true);
  }

  // ---------- 行動選択 ----------
  async chooseAction() {
    this.awaitingAction = true;
    try {
      while (true) {
        const choice = await ui.ask(["たたかう", "バッグ", "モンスター", "にげる"], { canCancel: false });
        if (choice === 0) {
          const mon = this.mode === "guest" ? this.currentGuestMon() : this.battle.me.mon();
          if (mon.moves.every((m) => m.pp <= 0)) {
            await this.say("だせる 技がない! わるあがきするしかない!");
            return { type: "move", idx: -1 };
          }
          const labels = mon.moves.map((m) => {
            const mv = moveData(m.id);
            return `${mv.name}  ${m.pp}/${mv.pp}`;
          });
          const descs = mon.moves.map((m) => {
            const mv = moveData(m.id);
            const power = mv.power > 0 ? mv.power : "—";
            const acc = mv.acc === null ? "—" : mv.acc;
            const cat = { phys: "ぶつり", spec: "とくしゅ", stat: "へんか" }[mv.cat];
            return `${mv.type} ${cat}  いりょく${power} めいちゅう${acc}`;
          });
          const mi = await ui.ask(labels, { descriptions: descs, descAtTop: true });
          if (mi === -1) continue;
          if (mon.moves[mi].pp <= 0) { await this.say("技の PPが のこっていない!"); continue; }
          return { type: "move", idx: mi };
        }
        if (choice === 1) {
          const act = await this.chooseBagAction();
          if (act) return act;
          continue;
        }
        if (choice === 2) {
          const idx = await this.choosePartyMon("だれに いれかえる?", true);
          if (idx === -1) continue;
          return { type: "switch", idx };
        }
        if (choice === 3) {
          if (this.mode !== "local" || this.o.kind !== "wild") {
            if (this.mode === "guest" || this.mode === "host") {
              const ok = await ui.confirm("こうさんして バトルを おわりますか?");
              if (ok) return { type: "forfeit" };
              continue;
            }
            await this.say("トレーナーせんからは にげられない!");
            continue;
          }
          return { type: "run" };
        }
      }
    } finally {
      this.awaitingAction = false;
    }
  }

  currentGuestMon() {
    return this.o.myParty[this.guestActive ?? (this.o.myActive ?? 0)];
  }

  async chooseBagAction() {
    if (this.mode !== "local") {
      await this.say("つうしんバトルでは アイテムを つかえない!");
      return null;
    }
    const bag = G.player.bag;
    const ids = Object.keys(bag).filter((id) => bag[id] > 0);
    if (ids.length === 0) { await this.say("バッグは からっぽだ!"); return null; }
    const labels = ids.map((id) => `${itemData(id).name} x${bag[id]}`);
    const sel = await ui.ask(labels);
    if (sel === -1) return null;
    const id = ids[sel];
    const fx = itemData(id).effect;
    if (fx.ball) {
      if (this.o.kind !== "wild") { await this.say("ひとの モンスターに ボールを なげちゃダメだ!"); return null; }
      if (G.player.party.length >= 6 && G.player.box.length >= 30) { await this.say("これいじょう モンスターを もてない!"); return null; }
      bag[id]--; if (bag[id] <= 0) delete bag[id];
      return { type: "ball", id };
    }
    // 回復系: 対象を選ぶ
    const party = G.player.party;
    const ti = await ui.ask(party.map((m) => `${m.name}  HP${m.curHp}/${statsOf(m).hp}`));
    if (ti === -1) return null;
    const target = party[ti];
    if (fx.revive && !isFainted(target)) { await this.say("げんきな モンスターには つかえない!"); return null; }
    if (!fx.revive && isFainted(target)) { await this.say("ひんしの モンスターには つかえない!"); return null; }
    if (fx.heal && !fx.revive && target.curHp >= statsOf(target).hp) { await this.say("HPは まんたんだ!"); return null; }
    bag[id]--; if (bag[id] <= 0) delete bag[id];
    return { type: "item", id, target: ti };
  }

  async choosePartyMon(prompt, canCancel) {
    const party = this.myParty();
    while (true) {
      const labels = party.map((m, i) => {
        const st = isFainted(m) ? "ひんし" : m.status ? STATUS_LABEL[m.status] : "";
        const active = (this.mode === "guest" ? i === (this.guestActive ?? 0) : this.battle.me.active === i) ? "▷" : " ";
        return `${active}${m.name} Lv${m.level} ${m.curHp}/${statsOf(m).hp} ${st}`;
      });
      const held = prompt ? ui.say(prompt) : null; // メニューの下に説明を表示しておく
      const idx = await ui.ask(labels, { canCancel });
      if (held) { ui.dismissTopDialog(); await held; }
      if (idx === -1) return -1;
      const mon = party[idx];
      const isActive = this.mode === "guest" ? idx === (this.guestActive ?? 0) : this.battle.me.active === idx;
      if (isActive) { await this.say("すでに たたかっている!"); continue; }
      if (isFainted(mon)) { await this.say("ひんしの モンスターは たたかえない!"); continue; }
      return idx;
    }
  }

  // ---------- イベント再生 ----------
  flipSide(side) { return side === "me" ? "foe" : "me"; }

  async playEvents(events, flip = false) {
    for (const e of events) {
      const side = e.side ? (flip ? this.flipSide(e.side) : e.side) : null;
      switch (e.t) {
        case "msg": {
          let text = e.text;
          await this.say(text);
          break;
        }
        case "anim": {
          if (e.kind === "hit" || e.kind === "superhit" || e.kind === "weakhit") {
            audio.sfx(e.kind);
            this.shake[side] = 6;
            await sleep(350);
            this.shake[side] = 0;
          } else if (e.kind === "heal") {
            audio.sfx("heal");
            await sleep(300);
          } else if (e.kind === "stat") {
            audio.sfx("select");
            await sleep(200);
          }
          break;
        }
        case "hp": {
          await this.animateHp(side, e.to, e.max);
          break;
        }
        case "status": {
          this.disp[side].status = e.status;
          break;
        }
        case "switch": {
          const summary = e.summary || (this.mode !== "guest" ? monSummary((side === "me" ? this.battle.me : this.battle.foe).mon()) : null);
          if (side === "me" && this.mode === "guest") this.guestActive = e.monIndex;
          this.hide[side] = true;
          await sleep(250);
          if (summary) this.disp[side] = summary;
          if (side === "foe") markSeen(this.disp.foe.species);
          this.hide[side] = false;
          await sleep(200);
          break;
        }
        case "faint": {
          audio.sfx("faint");
          this.faintAnim = side;
          await sleep(500);
          this.hide[side] = true;
          this.faintAnim = null;
          break;
        }
        case "expGain": {
          if (this.mode === "guest") break; // 通信戦は経験値なし
          const mon = this.battle.me.party.find((m) => m.uid === e.uid);
          if (mon && this.battle.me.mon() === mon) {
            await this.animateExp(e.before, e.after, e.levelBefore, e.levelAfter);
          }
          break;
        }
        case "levelup": {
          audio.sfx("levelup");
          if (this.mode !== "guest") {
            const mon = this.battle.me.party.find((m) => m.uid === e.uid);
            if (mon && this.battle.me.mon() === mon) this.disp.me = monSummary(mon);
          }
          await sleep(300);
          break;
        }
        case "learnPrompt": {
          await this.handleLearn(e);
          break;
        }
        case "evolvePrompt": {
          this.pendingEvolves ??= [];
          if (!this.pendingEvolves.some((p) => p.uid === e.uid && p.to === e.to)) this.pendingEvolves.push(e);
          break;
        }
        case "ballThrow": {
          await this.playBallThrow(e);
          break;
        }
        case "mustSwitch":
        case "foeWillSend": // ターン処理後にシーン側で対応する
          break;
        case "end": {
          await this.handleEnd(e.result, flip);
          return;
        }
      }
    }
  }

  async animateHp(side, to, max) {
    const d = this.disp[side];
    d.maxHp = max;
    const step = Math.max(1, Math.ceil(Math.abs(d.hp - to) / 24));
    while (d.hp !== to) {
      d.hp += d.hp < to ? Math.min(step, to - d.hp) : -Math.min(step, d.hp - to);
      await sleep(20);
    }
  }

  // 経験値バーを before→after へアニメーション (レベルの境界で満タン→0に巻き戻す)
  async animateExp(before, after, lvBefore, lvAfter) {
    const d = this.disp.me;
    d.level = lvBefore;
    let cur = before;
    const step = Math.max(1, Math.ceil((after - before) / 45));
    let ticks = 0;
    while (cur < after) {
      cur = Math.min(after, cur + step);
      const nextLvExp = expForLevel(d.level + 1);
      if (cur >= nextLvExp && d.level < lvAfter) {
        d.exp = nextLvExp; // いったん満タン表示
        await sleep(60);
        d.level++;         // 次のレベルへ (バーは0から)
      }
      d.exp = cur;
      if (ticks++ % 3 === 0) audio.sfx("select"); // 上昇音 (小刻み)
      await sleep(18);
    }
    d.exp = after;
    d.level = lvAfter;
  }

  async handleLearn(e) {
    const mon = this.battle.me.party.find((m) => m.uid === e.uid);
    if (!mon) return;
    const mv = moveData(e.move);
    if (mon.moves.length < 4) {
      mon.moves.push({ id: e.move, pp: mv.pp });
      audio.sfx("levelup");
      await this.say(`${mon.name}は ${mv.name}を おぼえた!`, false);
      return;
    }
    const ok = await ui.confirm(`${mon.name}は ${mv.name}を おぼえたい…。しかし 技は 4つまで。ほかの技を わすれさせますか?`);
    if (!ok) { await this.say(`${mon.name}は ${mv.name}を おぼえるのを あきらめた…`, false); return; }
    const labels = mon.moves.map((m) => moveData(m.id).name);
    const fi = await ui.ask(labels);
    if (fi === -1) { await this.say(`${mon.name}は ${mv.name}を おぼえるのを あきらめた…`, false); return; }
    const forgot = moveData(mon.moves[fi].id).name;
    mon.moves[fi] = { id: e.move, pp: mv.pp };
    await this.say(`${mon.name}は ${forgot}を わすれて ${mv.name}を おぼえた!`, false);
  }

  async playBallThrow(e) {
    audio.sfx("catch");
    this.hide.foe = true;
    this.ballAnim = { x: 170, y: 40, shake: 0 };
    await sleep(400);
    for (let i = 0; i < e.shakes; i++) {
      this.ballAnim.shake = i % 2 === 0 ? -2 : 2;
      audio.sfx("select");
      await sleep(450);
      this.ballAnim.shake = 0;
      await sleep(150);
    }
    if (e.caught) {
      audio.sfx("caught");
      await sleep(400);
    } else {
      this.ballAnim = null;
      this.hide.foe = false;
      await sleep(200);
    }
  }

  async handleEnd(result, flip) {
    this.finished = true;
    let r = result;
    if (flip && (this.mode === "guest")) {
      r = result === "win" ? "lose" : result === "lose" ? "win" : result;
    }
    if (r === "win") {
      if (this.o.kind === "trainer") {
        this.hide.foe = true;
        await this.say(`${this.o.foeTrainer.name}との しょうぶに かった!`, false);
        for (const line of this.o.foeTrainer.loseText || []) await this.say(line, false);
        if (this.battle.prizeMoney > 0) {
          G.player.money += this.battle.prizeMoney;
          await this.say(`しょうきんとして ${this.battle.prizeMoney}円 てにいれた!`, false);
        }
      } else if (this.mode !== "local") {
        await this.say("つうしんバトルに かった!", false);
      }
      await this.doEvolves();
    } else if (r === "lose") {
      if (this.mode !== "local") await this.say("つうしんバトルに まけた…", false);
      else await this.say(`${G.player.name}は めのまえが まっくらになった…`, false);
    } else if (r === "caught") {
      const caught = this.battle.foe.mon();
      caught.status = null;
      markCaught(caught.species);
      const nick = species(caught.species).name;
      if (G.player.party.length < 6) {
        G.player.party.push(caught);
        await this.say(`${nick}は てもちに くわわった!`, false);
      } else {
        G.player.box.push(caught);
        await this.say(`てもちが いっぱいなので ${nick}は ボックスに おくられた!`, false);
      }
      await this.doEvolves();
    }
    popScene();
    this.o.onEnd?.(r);
  }

  async doEvolves() {
    for (const e of this.pendingEvolves || []) {
      const mon = this.battle.me.party.find((m) => m.uid === e.uid);
      if (!mon || species(mon.species).evolve?.to !== e.to) continue;
      const ok = await ui.confirm(`おや…!? ${mon.name}の ようすが…! しんかさせますか?`);
      if (!ok) continue;
      const oldName = mon.name;
      evolveMon(mon, e.to);
      markCaught(e.to);
      audio.sfx("badge");
      await this.say(`おめでとう! ${oldName}は ${species(e.to).name}に しんかした!`, false);
    }
    this.pendingEvolves = [];
  }

  say(text, auto = 800) {
    return ui.say(text, auto ? { auto } : {});
  }

  // ---------- 描画 ----------
  draw(ctx, t) {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    grad.addColorStop(0, "#b8e0f8");
    grad.addColorStop(1, "#e8f4d8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // 足場
    ctx.fillStyle = "#a8cc88";
    ctx.beginPath(); ctx.ellipse(178, 62, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(56, 110, 46, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#98bc78";
    ctx.beginPath(); ctx.ellipse(178, 64, 42, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(56, 112, 46, 9, 0, 0, Math.PI * 2); ctx.fill();

    const shakeX = (s) => (this.shake[s] ? Math.sin(t / 25) * this.shake[s] : 0);

    // 敵スプライト
    if (this.disp.foe && !this.hide.foe) {
      const fy = this.faintAnim === "foe" ? 20 + ((t / 30) % 30) : 16;
      drawMonSprite(ctx, this.disp.foe.species, 154 + shakeX("foe"), fy, 3);
    }
    if (this.ballAnim) {
      const b = this.ballAnim;
      ctx.save();
      ctx.translate(b.x + b.shake, b.y + 20);
      ctx.fillStyle = "#303030"; ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = "#e05038"; ctx.fillRect(-5, -5, 10, 5);
      ctx.fillStyle = "#f8f8f8"; ctx.fillRect(-5, 0, 10, 5);
      ctx.fillStyle = "#303030"; ctx.fillRect(-5, -1, 10, 2);
      ctx.restore();
    }
    // 自分スプライト
    if (this.disp.me && !this.hide.me) {
      const my = this.faintAnim === "me" ? 70 + ((t / 30) % 30) : 66;
      drawMonSprite(ctx, this.disp.me.species, 32 + shakeX("me"), my, 3);
    }

    // 敵情報
    if (this.disp.foe) this.drawInfoBox(ctx, this.disp.foe, 4, 6, false);
    // 自分情報
    if (this.disp.me) this.drawInfoBox(ctx, this.disp.me, 132, 78, true);

    // 手持ちの のこり数 (小さなボール)。ひんしは グレーアウト。
    if (this.o.kind !== "wild") {
      const fs = this.partyStates("foe");
      if (fs) this.drawPartyDots(ctx, fs, 6, 0);
    }
    const ms = this.partyStates("me");
    if (ms) this.drawPartyDots(ctx, ms, 132, 71);

    // 行動待ちプロンプト
    if (this.awaitingAction && this.disp.me) {
      drawWindow(ctx, 2, SCREEN_H - 44, SCREEN_W - 4, 42);
      drawText(ctx, `${this.disp.me.name}は どうする?`, 10, SCREEN_H - 36, "#303030");
    }
    if (this.waitingMsg) {
      drawWindow(ctx, 2, SCREEN_H - 44, SCREEN_W - 4, 42);
      drawText(ctx, this.waitingMsg, 10, SCREEN_H - 36, "#303030");
    }
  }

  // 手持ちの状態リスト ("ok" / "fnt")。データが無い側は null。
  partyStates(side) {
    let party;
    if (this.mode === "guest") {
      party = side === "me" ? this.o.myParty : this.o.foeParty;
    } else if (this.battle) {
      party = (side === "me" ? this.battle.me : this.battle.foe).party;
    }
    if (!party || party.length === 0) return null;
    return party.map((m) => (isFainted(m) ? "fnt" : "ok"));
  }

  // 小さなモンスターボールを横一列に。ひんしは グレー。
  drawPartyDots(ctx, states, x, y) {
    for (let i = 0; i < states.length; i++) {
      const cx = x + i * 6 + 2, cy = y + 3;
      const fainted = states[i] === "fnt";
      // 輪郭
      ctx.fillStyle = fainted ? "#70707a" : "#282828";
      ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
      // 上半分(赤/グレー) と 下半分(白)
      ctx.fillStyle = fainted ? "#b0b0b8" : "#e05038";
      ctx.beginPath(); ctx.arc(cx, cy, 1.7, Math.PI, 0); ctx.fill();
      ctx.fillStyle = fainted ? "#d8d8dc" : "#f8f8f8";
      ctx.beginPath(); ctx.arc(cx, cy, 1.7, 0, Math.PI); ctx.fill();
    }
  }

  drawInfoBox(ctx, d, x, y, isMe) {
    const w = 104, h = isMe ? 40 : 30;
    drawWindow(ctx, x, y, w, h);
    drawText(ctx, d.name, x + 5, y + 4, "#303030");
    drawText(ctx, `Lv${d.level}`, x + w - 30, y + 4, "#303030");
    drawHpBar(ctx, x + 5, y + 16, w - 10, d.hp / d.maxHp);
    if (isMe) {
      drawText(ctx, `${d.hp}/${d.maxHp}`, x + 5, y + 22, "#505050");
      // 経験値バー
      if (d.exp !== undefined) {
        const cur = expForLevel(d.level);
        const next = expForLevel(d.level + 1);
        const ratio = Math.max(0, Math.min(1, (d.exp - cur) / Math.max(1, next - cur)));
        ctx.fillStyle = "#c8d0e0";
        ctx.fillRect(x + 5, y + 34, w - 10, 2);
        ctx.fillStyle = "#4a90d9";
        ctx.fillRect(x + 5, y + 34, Math.floor((w - 10) * ratio), 2);
      }
    }
    if (d.status) {
      ctx.fillStyle = STATUS_COLOR[d.status];
      ctx.fillRect(x + w - 32, y + 20, 28, 9);
      drawTextShadow(ctx, STATUS_LABEL[d.status], x + w - 30, y + 21, "#ffffff", "#00000060");
    }
  }
}
