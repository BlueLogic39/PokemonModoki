// モンスター個体の生成・ステータス計算・経験値・進化
import { species } from "../data/dex.js";
import { moveData } from "../data/moves.js";

let uidCounter = 1;
export function newUid() {
  return Date.now().toString(36) + "-" + (uidCounter++) + "-" + Math.floor(Math.random() * 1e6).toString(36);
}

// レベル → 必要累計経験値 (中速: level^3)
export function expForLevel(level) {
  return level * level * level;
}
export function levelFromExp(exp) {
  let l = 1;
  while (l < 100 && expForLevel(l + 1) <= exp) l++;
  return l;
}

export function statsOf(mon) {
  const s = species(mon.species);
  const L = mon.level;
  const st = {};
  for (const key of ["hp", "atk", "def", "spa", "spd", "spe"]) {
    const base = s.base[key];
    const iv = mon.ivs[key] || 0;
    if (key === "hp") st.hp = Math.floor(((2 * base + iv) * L) / 100) + L + 10;
    else st[key] = Math.floor(((2 * base + iv) * L) / 100) + 5;
  }
  return st;
}

function randIvs() {
  const ivs = {};
  for (const k of ["hp", "atk", "def", "spa", "spd", "spe"]) ivs[k] = Math.floor(Math.random() * 16);
  return ivs;
}

// そのレベルで覚えているはずの技 (最新4つ)
export function defaultMoves(speciesId, level) {
  const s = species(speciesId);
  const learned = s.learnset.filter(([lv]) => lv <= level).map(([, m]) => m);
  const uniq = [...new Set(learned)];
  return uniq.slice(-4).map((id) => ({ id, pp: moveData(id).pp }));
}

export function makeMon(speciesId, level, opts = {}) {
  const s = species(speciesId);
  const mon = {
    uid: newUid(),
    species: speciesId,
    name: opts.name || s.name,
    level,
    exp: expForLevel(level),
    ivs: opts.ivs || randIvs(),
    status: null, // psn / par / brn / slp
    moves: opts.moves || defaultMoves(speciesId, level),
    ot: opts.ot || null, // 親トレーナー名 (交換で来た子の表示用)
  };
  mon.curHp = statsOf(mon).hp;
  return mon;
}

export function healMon(mon) {
  mon.curHp = statsOf(mon).hp;
  mon.status = null;
  for (const mv of mon.moves) mv.pp = moveData(mv.id).pp;
}

export function isFainted(mon) {
  return mon.curHp <= 0;
}

// 経験値を加算し、発生したイベントを返す
// events: [{type:'levelup', level}, {type:'learn', move}, {type:'canEvolve', to}]
export function gainExp(mon, amount) {
  const events = [];
  const s = species(mon.species);
  mon.exp += amount;
  let newLevel = levelFromExp(mon.exp);
  if (newLevel > 100) newLevel = 100;
  while (mon.level < newLevel) {
    const oldStats = statsOf(mon);
    mon.level++;
    const newStats = statsOf(mon);
    mon.curHp += newStats.hp - oldStats.hp; // レベルアップ分のHPは増える
    events.push({ type: "levelup", level: mon.level });
    // 技習得
    for (const [lv, moveId] of s.learnset) {
      if (lv === mon.level && !mon.moves.some((m) => m.id === moveId)) {
        events.push({ type: "learn", move: moveId });
      }
    }
    // 進化チェック
    if (s.evolve && mon.level >= s.evolve.level) {
      events.push({ type: "canEvolve", to: s.evolve.to });
    }
  }
  return events;
}

export function evolveMon(mon, toId) {
  const oldStats = statsOf(mon);
  const wasDefaultName = mon.name === species(mon.species).name;
  mon.species = toId;
  if (wasDefaultName) mon.name = species(toId).name;
  const newStats = statsOf(mon);
  mon.curHp = Math.min(newStats.hp, mon.curHp + (newStats.hp - oldStats.hp));
}

// 通信交換・対戦用のシリアライズ (そのまま JSON で送れる形)
export function serializeMon(mon) {
  return JSON.parse(JSON.stringify(mon));
}
export function deserializeMon(data) {
  // 最低限の検証
  species(data.species);
  if (!Array.isArray(data.moves) || data.moves.length < 1) throw new Error("bad mon data");
  for (const m of data.moves) moveData(m.id);
  const mon = {
    uid: data.uid || newUid(),
    species: data.species,
    name: String(data.name || species(data.species).name).slice(0, 10),
    level: Math.max(1, Math.min(100, data.level | 0)),
    exp: data.exp | 0,
    ivs: data.ivs || {},
    status: null,
    moves: data.moves.slice(0, 4).map((m) => ({ id: m.id, pp: Math.min(m.pp | 0, moveData(m.id).pp) })),
    ot: data.ot || null,
  };
  mon.exp = Math.max(expForLevel(mon.level), mon.exp);
  mon.curHp = statsOf(mon).hp;
  return mon;
}
