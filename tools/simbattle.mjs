// バトルエンジンの自動テスト: node tools/simbattle.mjs
import { Battle } from "../js/core/battle.js";
import { makeMon, gainExp, expForLevel, statsOf, isFainted, evolveMon, deserializeMon, serializeMon } from "../js/core/monster.js";
import { DEX } from "../js/data/dex.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error("NG:", msg); } };

// ---- レベル・経験値 ----
{
  const m = makeMon("leafy", 5);
  check(m.exp === expForLevel(5), "初期exp");
  const evs = gainExp(m, expForLevel(16) - m.exp);
  check(m.level === 16, `Lv16になる (実際 ${m.level})`);
  check(evs.some((e) => e.type === "canEvolve" && e.to === "foresta"), "進化イベント発生");
  check(evs.some((e) => e.type === "learn"), "技習得イベント発生");
  const hpBefore = m.curHp;
  evolveMon(m, "foresta");
  check(m.species === "foresta" && m.name === "フォレスタ", "進化後の名前");
  check(m.curHp >= hpBefore, "進化でHPが減らない");
}

// ---- シリアライズ ----
{
  const m = makeMon("tatsume", 32);
  const d = deserializeMon(serializeMon(m));
  check(d.species === "tatsume" && d.level === 32, "serialize往復");
}

// ---- ランダム対戦を大量に回す ----
let totalTurns = 0;
for (let trial = 0; trial < 300; trial++) {
  const pick = () => DEX[Math.floor(Math.random() * DEX.length)].id;
  const lvl = () => 3 + Math.floor(Math.random() * 45);
  const myParty = [makeMon(pick(), lvl()), makeMon(pick(), lvl())];
  const foeParty = trial % 3 === 0 ? [makeMon(pick(), lvl())] : [makeMon(pick(), lvl()), makeMon(pick(), lvl())];
  const kind = trial % 3 === 0 ? "wild" : trial % 3 === 1 ? "trainer" : "link";
  const b = new Battle({ myParty, foeParty, kind, trainerName: "テスト", prizeMoney: 100 });
  let turns = 0;
  try {
    while (!b.result && turns < 200) {
      turns++;
      const mon = b.me.mon();
      let action;
      const r = Math.random();
      if (r < 0.75) {
        const usable = mon.moves.map((m, i) => ({ m, i })).filter(({ m }) => m.pp > 0);
        action = usable.length ? { type: "move", idx: usable[Math.floor(Math.random() * usable.length)].i } : { type: "move", idx: -1 };
      } else if (r < 0.85 && kind === "wild") {
        action = { type: "ball", id: Math.random() < 0.5 ? "ball1" : "ball3" };
      } else if (r < 0.95) {
        const others = b.me.party.map((m, i) => ({ m, i })).filter(({ m, i }) => i !== b.me.active && !isFainted(m));
        action = others.length ? { type: "switch", idx: others[0].i } : { type: "move", idx: 0 };
      } else {
        action = { type: "run" };
      }
      const events = b.turn(action, kind === "link" ? b.aiAction() : null);
      // mustSwitch対応
      if (events.some((e) => e.t === "mustSwitch")) {
        const next = b.me.party.findIndex((m) => !isFainted(m) && b.me.party.indexOf(m) !== b.me.active);
        if (next >= 0) b.forceSwitch(next);
      }
      for (const e of events) {
        if (e.t === "hp") {
          check(e.to >= 0 && e.to <= e.max, `HPが範囲内 (${e.to}/${e.max})`);
        }
        if (e.t === "msg") check(typeof e.text === "string" && !e.text.includes("undefined"), `msgにundefined: ${e.text}`);
      }
    }
    check(turns < 200, `試合が終わる (kind=${kind})`);
    check(["win", "lose", "caught", "ran"].includes(b.result), `結果が正しい: ${b.result}`);
  } catch (e) {
    failures++;
    console.error(`NG: 対戦${trial} (${kind}) で例外:`, e.message);
    break;
  }
  totalTurns += turns;
}

// ---- わるあがき (PP切れ) ----
{
  const m = makeMon("koronezu", 10);
  for (const mv of m.moves) mv.pp = 0;
  const b = new Battle({ myParty: [m], foeParty: [makeMon("pipitto", 10)], kind: "wild" });
  const evs = b.turn({ type: "move", idx: -1 });
  check(evs.some((e) => e.t === "msg" && e.text.includes("わるあがき")), "わるあがきが出る");
}

// ---- 必中ボール ----
{
  const b = new Battle({ myParty: [makeMon("leafy", 50)], foeParty: [makeMon("tengenryu", 45)], kind: "wild" });
  const evs = b.turn({ type: "ball", id: "ballX" });
  check(b.result === "caught", "ミラクルボールで必ず捕獲");
  check(evs.some((e) => e.t === "ballThrow" && e.caught), "捕獲イベント");
}

console.log(failures === 0 ? `OK: 全テスト合格! (合計${totalTurns}ターンをシミュレーション)` : `失敗 ${failures}件`);
process.exit(failures ? 1 : 0);
