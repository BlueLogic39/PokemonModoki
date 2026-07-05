// バトルエンジン (UI非依存)
// 1ターン分を計算して「イベント列」を返す。シーン側がそれを順番に演出する。
// kind: "wild" | "trainer" | "link"
// side: "me" (自分) / "foe" (相手) — link対戦ではホスト視点
import { species } from "../data/dex.js";
import { moveData } from "../data/moves.js";
import { itemData } from "../data/items.js";
import { statsOf, isFainted, gainExp } from "./monster.js";
import { typeMultiplier } from "../data/types.js";

const STATUS_NAME = { psn: "どく", par: "まひ", brn: "やけど", slp: "ねむり" };

// 通信対戦のゲスト表示用サマリー
export function summaryOf(mon) {
  return {
    species: mon.species, name: mon.name, level: mon.level,
    hp: mon.curHp, maxHp: statsOf(mon).hp, status: mon.status, exp: mon.exp,
  };
}

function stageMult(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function accMult(s) { return s >= 0 ? (3 + s) / 3 : 3 / (3 - s); }

class Side {
  constructor(party) {
    this.party = party;
    this.active = party.findIndex((m) => !isFainted(m));
    this.resetVolatile();
  }
  resetVolatile() {
    this.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    this.flinched = false;
    this.sleepTurns = 0;
  }
  mon() { return this.party[this.active]; }
  aliveCount() { return this.party.filter((m) => !isFainted(m)).length; }
}

export class Battle {
  constructor({ myParty, foeParty, kind = "wild", trainerName = null, prizeMoney = 0, rng = Math.random }) {
    this.me = new Side(myParty);
    this.foe = new Side(foeParty);
    this.kind = kind;
    this.trainerName = trainerName;
    this.prizeMoney = prizeMoney;
    this.rng = rng;
    this.result = null; // win / lose / caught / ran
    this.runAttempts = 0;
    this.participants = new Set([this.me.mon()?.uid]);
    if (this.foe.mon()) this.foe.sleepInit = 0;
  }

  side(name) { return name === "me" ? this.me : this.foe; }
  other(name) { return name === "me" ? "foe" : "me"; }

  effStat(sideName, key) {
    const side = this.side(sideName);
    const mon = side.mon();
    let v = statsOf(mon)[key] * stageMult(side.stages[key]);
    if (key === "atk" && mon.status === "brn") v *= 0.5;
    if (key === "spe" && mon.status === "par") v *= 0.5;
    return Math.max(1, Math.floor(v));
  }

  // ---------- ターン処理 ----------
  // myAction / foeAction: {type:'move',idx} {type:'switch',idx} {type:'item',id,target} {type:'run'} {type:'ball',id}
  // foeAction 省略時はAIが決める
  turn(myAction, foeAction = null) {
    const ev = [];
    this.me.flinched = false;
    this.foe.flinched = false;
    if (!foeAction) foeAction = this.aiAction();

    // 行動順: 逃げる/アイテム/交代 が先。技は優先度 → 素早さ
    const order = this.actionOrder(myAction, foeAction);
    const startUids = { me: this.me.mon()?.uid, foe: this.foe.mon()?.uid };
    for (const who of order) {
      if (this.result) break;
      const action = who === "me" ? myAction : foeAction;
      const target = this.other(who);
      const mon = this.side(who).mon();
      // 行動前に倒れた / 倒れて交代済みなら、そのターンの行動は消滅
      if (!mon || isFainted(mon) || mon.uid !== startUids[who]) continue;
      this.execAction(who, target, action, ev);
      // 倒れたら処理
      this.checkFaints(ev);
    }
    // ターン終了時の毒・やけどダメージ
    if (!this.result) {
      for (const who of ["me", "foe"]) {
        const mon = this.side(who).mon();
        if (!mon || isFainted(mon)) continue;
        if (mon.status === "psn" || mon.status === "brn") {
          const max = statsOf(mon).hp;
          const dmg = Math.max(1, Math.floor(max / (mon.status === "psn" ? 8 : 16)));
          ev.push({ t: "msg", text: `${mon.name}は ${STATUS_NAME[mon.status]}の ダメージを うけている!` });
          this.dealDamage(who, dmg, ev);
          this.checkFaints(ev);
          if (this.result) break;
        }
      }
    }
    if (this.result) ev.push({ t: "end", result: this.result });
    return ev;
  }

  actionOrder(myAction, foeAction) {
    const pri = (a, sideName) => {
      if (a.type !== "move") return 6; // 技以外は先行
      const mv = this.moveOf(sideName, a.idx);
      return mv?.effect?.priority || 0;
    };
    const pm = pri(myAction, "me"), pf = pri(foeAction, "foe");
    if (pm !== pf) return pm > pf ? ["me", "foe"] : ["foe", "me"];
    const sm = this.effStat("me", "spe"), sf = this.effStat("foe", "spe");
    if (sm !== sf) return sm > sf ? ["me", "foe"] : ["foe", "me"];
    return this.rng() < 0.5 ? ["me", "foe"] : ["foe", "me"];
  }

  moveOf(sideName, idx) {
    const mon = this.side(sideName).mon();
    const slot = mon.moves[idx];
    if (!slot) return null;
    return moveData(slot.id);
  }

  execAction(who, target, action, ev) {
    const side = this.side(who);
    const mon = side.mon();
    switch (action.type) {
      case "run": {
        if (this.kind !== "wild") {
          ev.push({ t: "msg", text: "トレーナーせんからは にげられない!" });
          return;
        }
        this.runAttempts++;
        const mySpe = this.effStat(who, "spe"), foeSpe = this.effStat(target, "spe");
        const p = Math.min(1, mySpe / Math.max(1, foeSpe) * 0.7 + this.runAttempts * 0.2);
        if (this.rng() < p) {
          ev.push({ t: "msg", text: "うまく にげきれた!" });
          this.result = "ran";
        } else {
          ev.push({ t: "msg", text: "にげられなかった!" });
        }
        return;
      }
      case "switch": {
        const newMon = side.party[action.idx];
        ev.push({ t: "msg", text: `もどれ! ${mon.name}!` });
        side.active = action.idx;
        side.resetVolatile();
        ev.push({ t: "switch", side: who, monIndex: action.idx, summary: summaryOf(newMon) });
        ev.push({ t: "msg", text: `いけっ! ${newMon.name}!` });
        if (who === "me") this.participants.add(newMon.uid);
        return;
      }
      case "forfeit": {
        ev.push({ t: "msg", text: who === "me" ? "こちらは こうさんした!" : "あいてが こうさんした!" });
        this.result = who === "me" ? "lose" : "win";
        return;
      }
      case "item": {
        this.useItem(who, action, ev);
        return;
      }
      case "ball": {
        this.throwBall(who, action.id, ev);
        return;
      }
      case "move": {
        this.execMove(who, target, action.idx, ev);
        return;
      }
    }
  }

  // ---------- 技 ----------
  execMove(who, targetName, moveIdx, ev) {
    const side = this.side(who);
    const mon = side.mon();
    const targetSide = this.side(targetName);
    const targetMon = targetSide.mon();

    // ひるみ
    if (side.flinched) {
      ev.push({ t: "msg", text: `${mon.name}は ひるんで うごけない!` });
      return;
    }
    // ねむり
    if (mon.status === "slp") {
      if (side.sleepTurns > 0) {
        side.sleepTurns--;
        ev.push({ t: "msg", text: `${mon.name}は ぐうぐう ねむっている…` });
        return;
      }
      mon.status = null;
      ev.push({ t: "msg", text: `${mon.name}は めを さました!` });
      ev.push({ t: "status", side: who, status: null });
    }
    // まひ
    if (mon.status === "par" && this.rng() < 0.25) {
      ev.push({ t: "msg", text: `${mon.name}は からだが しびれて うごけない!` });
      return;
    }

    // わるあがき
    let mv, slot = null;
    if (moveIdx === -1) {
      mv = { name: "わるあがき", type: "ノーマル", cat: "phys", power: 50, acc: null, pp: 1, effect: { recoilFlat: 0.25 } };
    } else {
      slot = mon.moves[moveIdx];
      mv = moveData(slot.id);
      if (slot.pp <= 0) {
        ev.push({ t: "msg", text: "技の PPが のこっていない!" });
        return;
      }
      slot.pp--;
    }
    ev.push({ t: "msg", text: `${mon.name}の ${mv.name}!` });

    // 命中判定
    if (mv.acc !== null) {
      const acc = mv.acc / 100 * accMult(side.stages.acc) / accMult(targetSide.stages.eva);
      if (this.rng() > acc) {
        ev.push({ t: "msg", text: "しかし はずれた!" });
        return;
      }
    }

    if (mv.cat === "stat") {
      this.applyEffect(who, targetName, mv, 0, ev, true);
      return;
    }

    // ダメージ計算
    const atkKey = mv.cat === "phys" ? "atk" : "spa";
    const defKey = mv.cat === "phys" ? "def" : "spd";
    const A = this.effStat(who, atkKey);
    const D = this.effStat(targetName, defKey);
    const L = mon.level;
    const stab = species(mon.species).types.includes(mv.type) ? 1.5 : 1;
    const typeMult = typeMultiplier(mv.type, species(targetMon.species).types);
    const crit = this.rng() < 1 / 16 ? 1.5 : 1;
    const rand = 0.85 + this.rng() * 0.15;
    let dmg = Math.floor((((2 * L / 5 + 2) * mv.power * A / D) / 50 + 2) * stab * typeMult * crit * rand);

    if (typeMult === 0) {
      ev.push({ t: "msg", text: `${targetMon.name}には こうかが ないようだ…` });
      return;
    }
    dmg = Math.max(1, dmg);
    const kind = typeMult >= 2 ? "superhit" : typeMult <= 0.5 ? "weakhit" : "hit";
    ev.push({ t: "anim", kind, side: targetName });
    const dealt = this.dealDamage(targetName, dmg, ev);
    if (crit > 1) ev.push({ t: "msg", text: "きゅうしょに あたった!" });
    if (typeMult >= 2) ev.push({ t: "msg", text: "こうかは ばつぐんだ!" });
    else if (typeMult <= 0.5) ev.push({ t: "msg", text: "こうかは いまひとつの ようだ…" });

    // 追加効果
    if (!isFainted(targetMon)) this.applyEffect(who, targetName, mv, dealt, ev, false);

    // ドレイン / 反動
    const fx = mv.effect || {};
    if (fx.drain && dealt > 0) {
      const heal = Math.max(1, Math.floor(dealt * fx.drain));
      this.healDamage(who, heal, ev);
      ev.push({ t: "msg", text: `${mon.name}は たいりょくを すいとった!` });
    }
    if (fx.recoil && dealt > 0) {
      const rec = Math.max(1, Math.floor(dealt * fx.recoil));
      ev.push({ t: "msg", text: `${mon.name}は はんどうで ダメージを うけた!` });
      this.dealDamage(who, rec, ev);
    }
    if (fx.recoilFlat) {
      const rec = Math.max(1, Math.floor(statsOf(mon).hp * fx.recoilFlat));
      ev.push({ t: "msg", text: `${mon.name}は はんどうで ダメージを うけた!` });
      this.dealDamage(who, rec, ev);
    }
  }

  applyEffect(who, targetName, mv, dealt, ev, isStatusMove) {
    const fx = mv.effect;
    if (!fx) {
      if (isStatusMove) ev.push({ t: "msg", text: "しかし なにも おこらなかった!" });
      return;
    }
    const chance = (fx.chance ?? 100) / 100;
    const targetSide = fx.target === "self" ? this.side(who) : this.side(targetName);
    const targetWho = fx.target === "self" ? who : targetName;
    const tmon = targetSide.mon();

    // 自己回復
    if (fx.heal !== undefined && fx.status === undefined) {
      const side = this.side(who);
      const m = side.mon();
      const max = statsOf(m).hp;
      if (m.curHp >= max) { ev.push({ t: "msg", text: "しかし HPは まんたんだ!" }); return; }
      this.healDamage(who, Math.floor(max * fx.heal), ev);
      ev.push({ t: "msg", text: `${m.name}の たいりょくが かいふくした!` });
      ev.push({ t: "anim", kind: "heal", side: who });
      return;
    }
    // 能力変化
    if (fx.stages && this.rng() < chance) {
      for (const [key, delta] of Object.entries(fx.stages)) {
        const cur = targetSide.stages[key];
        const next = Math.max(-6, Math.min(6, cur + delta));
        if (next === cur) {
          if (isStatusMove) ev.push({ t: "msg", text: `${tmon.name}の のうりょくは もう かわらない!` });
          continue;
        }
        targetSide.stages[key] = next;
        const label = { atk: "こうげき", def: "ぼうぎょ", spa: "とくこう", spd: "とくぼう", spe: "すばやさ", acc: "めいちゅう", eva: "かいひ" }[key];
        ev.push({ t: "anim", kind: "stat", side: targetWho });
        ev.push({ t: "msg", text: `${tmon.name}の ${label}が ${delta > 0 ? "あがった" : "さがった"}!` });
      }
    }
    // 状態異常
    if (fx.status && this.rng() < chance) {
      if (tmon.status) {
        if (isStatusMove) ev.push({ t: "msg", text: `${tmon.name}には すでに こうかがある!` });
      } else {
        // タイプ免疫: ほのおはやけどしない、どくはどくにならない、でんきはまひしない
        const ttypes = species(tmon.species).types;
        if ((fx.status === "brn" && ttypes.includes("ほのお")) ||
            (fx.status === "psn" && ttypes.includes("どく")) ||
            (fx.status === "par" && ttypes.includes("でんき"))) {
          if (isStatusMove) ev.push({ t: "msg", text: "しかし こうかが なかった!" });
        } else {
          tmon.status = fx.status;
          if (fx.status === "slp") targetSide.sleepTurns = 1 + Math.floor(this.rng() * 3);
          ev.push({ t: "status", side: targetWho, status: fx.status });
          const verbs = { psn: "どくを あびた", par: "まひして わざが でにくくなった", brn: "やけどを おった", slp: "ねむってしまった" };
          ev.push({ t: "msg", text: `${tmon.name}は ${verbs[fx.status]}!` });
        }
      }
    }
    // ひるみ
    if (fx.flinch && this.rng() < fx.flinch / 100) {
      targetSide.flinched = true;
    }
  }

  dealDamage(sideName, dmg, ev) {
    const mon = this.side(sideName).mon();
    const from = mon.curHp;
    mon.curHp = Math.max(0, mon.curHp - dmg);
    ev.push({ t: "hp", side: sideName, from, to: mon.curHp, max: statsOf(mon).hp });
    return from - mon.curHp;
  }
  healDamage(sideName, amount, ev) {
    const mon = this.side(sideName).mon();
    const max = statsOf(mon).hp;
    const from = mon.curHp;
    mon.curHp = Math.min(max, mon.curHp + amount);
    ev.push({ t: "hp", side: sideName, from, to: mon.curHp, max });
  }

  // ---------- アイテム ----------
  useItem(who, action, ev) {
    const it = itemData(action.id);
    const side = this.side(who);
    const target = side.party[action.target ?? side.active];
    ev.push({ t: "msg", text: `${it.name}を つかった!` });
    const fx = it.effect;
    if (fx.heal) {
      const max = statsOf(target).hp;
      const from = target.curHp;
      target.curHp = Math.min(max, target.curHp + fx.heal);
      if (side.party[side.active] === target) ev.push({ t: "hp", side: who, from, to: target.curHp, max });
      ev.push({ t: "msg", text: `${target.name}の HPが かいふくした!` });
      ev.push({ t: "anim", kind: "heal", side: who });
    }
    if (fx.cure) {
      if (target.status && fx.cure.includes(target.status)) {
        target.status = null;
        if (side.party[side.active] === target) ev.push({ t: "status", side: who, status: null });
        ev.push({ t: "msg", text: `${target.name}は げんきに なった!` });
      } else {
        ev.push({ t: "msg", text: "しかし こうかが なかった…" });
      }
    }
    if (fx.revive) {
      if (isFainted(target)) {
        target.curHp = Math.max(1, Math.floor(statsOf(target).hp * fx.revive));
        ev.push({ t: "msg", text: `${target.name}は めを さました!` });
      } else {
        ev.push({ t: "msg", text: "しかし こうかが なかった…" });
      }
    }
  }

  // ---------- 捕獲 ----------
  throwBall(who, ballId, ev) {
    const it = itemData(ballId);
    if (this.kind !== "wild") {
      ev.push({ t: "msg", text: "ひとの モンスターに ボールを なげるなんて!" });
      return;
    }
    const foeMon = this.foe.mon();
    const sp = species(foeMon.species);
    const max = statsOf(foeMon).hp;
    const statusBonus = foeMon.status === "slp" ? 2 : foeMon.status ? 1.5 : 1;
    const a = Math.min(255, ((3 * max - 2 * foeMon.curHp) * sp.catchRate * it.effect.ball) / (3 * max) * statusBonus);
    const caught = a >= 255 || this.rng() * 255 < a;
    const shakes = caught ? 3 : Math.min(2, Math.floor((a / 255) * 3 + this.rng()));
    ev.push({ t: "msg", text: `${it.name}を なげた!` });
    ev.push({ t: "ballThrow", shakes, caught });
    if (caught) {
      ev.push({ t: "msg", text: `やったー! ${foeMon.name}を つかまえた!` });
      this.result = "caught";
    } else {
      ev.push({ t: "msg", text: "ああっ! でてきてしまった!" });
    }
  }

  // ---------- ひんし処理 ----------
  checkFaints(ev) {
    // 相手側
    const foeMon = this.foe.mon();
    if (foeMon && isFainted(foeMon) && !this.foeFaintHandled?.has(foeMon.uid)) {
      (this.foeFaintHandled ??= new Set()).add(foeMon.uid);
      ev.push({ t: "faint", side: "foe" });
      ev.push({ t: "msg", text: `${this.kind === "wild" ? "やせいの " : ""}${foeMon.name}は たおれた!` });
      this.giveExp(foeMon, ev);
      if (this.foe.aliveCount() === 0) {
        this.result = "win";
      } else if (this.kind === "trainer") {
        // ストーリー: すぐには繰り出さず「繰り出そうとしている」状態にする
        // (シーン側が入れ替え確認をしてから continueAfterFoeFaint を呼ぶ)
        const next = this.foe.party.findIndex((m) => !isFainted(m));
        this.pendingFoeSend = next;
        ev.push({ t: "foeWillSend", monIndex: next, name: this.foe.party[next].name });
      } else {
        // 通信対戦: 勝ち抜き式で自動的に繰り出す
        const next = this.foe.party.findIndex((m) => !isFainted(m));
        this.foe.active = next;
        this.foe.resetVolatile();
        this.participants = new Set([this.me.mon()?.uid]);
        ev.push({ t: "switch", side: "foe", monIndex: next, summary: summaryOf(this.foe.mon()) });
        ev.push({ t: "msg", text: `${this.trainerName ?? "あいて"}は ${this.foe.mon().name}を くりだした!` });
      }
    }
    // 自分側
    const myMon = this.me.mon();
    if (myMon && isFainted(myMon)) {
      ev.push({ t: "faint", side: "me" });
      ev.push({ t: "msg", text: `${myMon.name}は たおれた!` });
      if (this.me.aliveCount() === 0) {
        this.result = "lose";
      } else if (this.kind === "link") {
        // 通信対戦は次のモンスターを自動で繰り出す
        const next = this.me.party.findIndex((m) => !isFainted(m));
        this.me.active = next;
        this.me.resetVolatile();
        ev.push({ t: "switch", side: "me", monIndex: next, summary: summaryOf(this.me.mon()) });
        ev.push({ t: "msg", text: `いけっ! ${this.me.mon().name}!` });
      } else {
        ev.push({ t: "mustSwitch" }); // シーン側が交代UIを出す
      }
    }
  }

  // 相手のひんし後の続き (ストーリーのみ)
  // switchIdx を渡すと相手が次を繰り出す前にこちらも無償で入れ替える
  continueAfterFoeFaint(switchIdx = null) {
    const ev = [];
    if (switchIdx !== null && switchIdx !== this.me.active && !isFainted(this.me.party[switchIdx])) {
      ev.push({ t: "msg", text: `もどれ! ${this.me.mon().name}!` });
      this.me.active = switchIdx;
      this.me.resetVolatile();
      ev.push({ t: "switch", side: "me", monIndex: switchIdx, summary: summaryOf(this.me.mon()) });
      ev.push({ t: "msg", text: `いけっ! ${this.me.mon().name}!` });
    }
    const next = this.pendingFoeSend;
    this.pendingFoeSend = null;
    if (next != null && next >= 0 && !isFainted(this.foe.party[next])) {
      this.foe.active = next;
      this.foe.resetVolatile();
      this.participants = new Set([this.me.mon()?.uid]);
      ev.push({ t: "switch", side: "foe", monIndex: next, summary: summaryOf(this.foe.mon()) });
      ev.push({ t: "msg", text: `${this.trainerName ?? "あいて"}は ${this.foe.mon().name}を くりだした!` });
    }
    return ev;
  }

  // シーンからの交代 (ひんし後・ターン消費なし)
  forceSwitch(idx) {
    const ev = [];
    this.me.active = idx;
    this.me.resetVolatile();
    this.participants.add(this.me.mon().uid);
    ev.push({ t: "switch", side: "me", monIndex: idx, summary: summaryOf(this.me.mon()) });
    ev.push({ t: "msg", text: `いけっ! ${this.me.mon().name}!` });
    return ev;
  }

  giveExp(faintedFoe, ev) {
    if (this.kind === "link") return;
    const sp = species(faintedFoe.species);
    const parts = this.me.party.filter((m) => this.participants.has(m.uid) && !isFainted(m));
    if (parts.length === 0) return;
    const baseAmount = Math.floor((sp.expYield * faintedFoe.level) / 7 / parts.length * (this.kind === "trainer" ? 1.5 : 1));
    for (const m of parts) {
      if (m.level >= 100) continue;
      ev.push({ t: "msg", text: `${m.name}は ${baseAmount}の けいけんちを もらった!` });
      const results = gainExp(m, baseAmount);
      for (const r of results) {
        if (r.type === "levelup") {
          ev.push({ t: "levelup", uid: m.uid });
          ev.push({ t: "msg", text: `${m.name}は レベル${r.level}に あがった!` });
        } else if (r.type === "learn") {
          ev.push({ t: "learnPrompt", uid: m.uid, move: r.move });
        } else if (r.type === "canEvolve") {
          ev.push({ t: "evolvePrompt", uid: m.uid, to: r.to });
        }
      }
    }
  }

  // ---------- AI ----------
  aiAction() {
    const mon = this.foe.mon();
    const myMon = this.me.mon();
    const usable = mon.moves.map((m, i) => ({ m, i })).filter(({ m }) => m.pp > 0);
    if (usable.length === 0) return { type: "move", idx: -1 }; // わるあがき
    let best = null, bestScore = -1;
    for (const { m, i } of usable) {
      const mv = moveData(m.id);
      let score;
      if (mv.cat === "stat") {
        score = 12;
        const fx = mv.effect || {};
        if (fx.status && myMon.status) score = 2; // すでに状態異常
        if (fx.stages && fx.target === "self") {
          const total = Object.values(this.foe.stages).reduce((a, b) => a + Math.abs(b), 0);
          score = total >= 4 ? 3 : 14;
        }
        if (fx.heal) {
          const ratio = mon.curHp / statsOf(mon).hp;
          score = ratio < 0.4 ? 40 : 2;
        }
        score *= 0.8 + this.rng() * 0.6;
      } else {
        const typeMult = typeMultiplier(mv.type, species(myMon.species).types);
        const stab = species(mon.species).types.includes(mv.type) ? 1.5 : 1;
        score = mv.power * typeMult * stab * ((mv.acc ?? 100) / 100);
        score *= 0.85 + this.rng() * 0.3;
      }
      if (score > bestScore) { bestScore = score; best = i; }
    }
    return { type: "move", idx: best };
  }

  // 手持ち全員のPPが尽きているか (わるあがき判定)
  mustStruggle(sideName = "me") {
    const mon = this.side(sideName).mon();
    return mon.moves.every((m) => m.pp <= 0);
  }
}
