// 技データ
// cat: "phys"(物理) / "spec"(特殊) / "stat"(変化)
// effect:
//   status: "psn"|"par"|"brn"|"slp"  (chance % で相手に付与)
//   stages: { 対象ステータス: 段階 }  target: "self"|"foe"  (chance % で発動、省略時100)
//   drain: 与ダメの回復割合 / recoil: 与ダメの反動割合 / heal: 最大HPの回復割合
//   flinch: ひるみ確率% / priority: 優先度
export const MOVES = {
  // ノーマル
  taiatari:    { name: "たいあたり",       type: "ノーマル", cat: "phys", power: 40,  acc: 100, pp: 35 },
  sharpclaw:   { name: "シャープクロー",   type: "ノーマル", cat: "phys", power: 70,  acc: 100, pp: 20 },
  noshikakari: { name: "のしかかり",       type: "ノーマル", cat: "phys", power: 85,  acc: 100, pp: 15, effect: { status: "par", chance: 10 } },
  zutsuki:     { name: "ずつき",           type: "ノーマル", cat: "phys", power: 70,  acc: 100, pp: 15, effect: { flinch: 30 } },
  otakebi:     { name: "おたけび",         type: "ノーマル", cat: "spec", power: 90,  acc: 100, pp: 10 },
  nakigoe:     { name: "なきごえ",         type: "ノーマル", cat: "stat", power: 0,   acc: 100, pp: 40, effect: { stages: { atk: -1 }, target: "foe" } },
  katakunaru:  { name: "かたくなる",       type: "ノーマル", cat: "stat", power: 0,   acc: null, pp: 30, effect: { stages: { def: 1 }, target: "self" } },
  kiaitame:    { name: "きあいため",       type: "ノーマル", cat: "stat", power: 0,   acc: null, pp: 30, effect: { stages: { atk: 1 }, target: "self" } },
  shippu:      { name: "しっぷうづき",     type: "ノーマル", cat: "phys", power: 40,  acc: 100, pp: 30, effect: { priority: 1 } },
  // ほのお
  hinoko:      { name: "ひのこ",           type: "ほのお", cat: "spec", power: 40,  acc: 100, pp: 25, effect: { status: "brn", chance: 10 } },
  kaenguruma:  { name: "かえんぐるま",     type: "ほのお", cat: "phys", power: 60,  acc: 100, pp: 25, effect: { status: "brn", chance: 10 } },
  flameburner: { name: "フレイムバーナー", type: "ほのお", cat: "spec", power: 90,  acc: 100, pp: 15, effect: { status: "brn", chance: 10 } },
  hifist:      { name: "ほのおのこぶし",   type: "ほのお", cat: "phys", power: 75,  acc: 100, pp: 15, effect: { status: "brn", chance: 10 } },
  onibi:       { name: "おにび",           type: "ほのお", cat: "stat", power: 0,   acc: 85,  pp: 15, effect: { status: "brn", chance: 100 } },
  // みず
  mizudeppo:   { name: "みずでっぽう",     type: "みず", cat: "spec", power: 40,  acc: 100, pp: 25 },
  bubblewave:  { name: "バブルウェーブ",   type: "みず", cat: "spec", power: 65,  acc: 100, pp: 20, effect: { stages: { spe: -1 }, target: "foe", chance: 10 } },
  tidalwave:   { name: "タイダルウェーブ", type: "みず", cat: "spec", power: 90,  acc: 100, pp: 15 },
  aquadash:    { name: "アクアダッシュ",   type: "みず", cat: "phys", power: 40,  acc: 100, pp: 20, effect: { priority: 1 } },
  // くさ
  tsurunomuchi:{ name: "つるのムチ",       type: "くさ", cat: "phys", power: 45,  acc: 100, pp: 25 },
  leafcutter:  { name: "リーフカッター",   type: "くさ", cat: "phys", power: 55,  acc: 95,  pp: 25 },
  leafdrain:   { name: "リーフドレイン",   type: "くさ", cat: "spec", power: 75,  acc: 100, pp: 10, effect: { drain: 0.5 } },
  greenburst:  { name: "グリーンバースト", type: "くさ", cat: "spec", power: 90,  acc: 100, pp: 10 },
  nemurigona:  { name: "ねむりごな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 15, effect: { status: "slp", chance: 100 } },
  dokunokona:  { name: "どくのこな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 20, effect: { status: "psn", chance: 100 } },
  shibiregona: { name: "しびれごな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 20, effect: { status: "par", chance: 100 } },
  // でんき
  denkishock:  { name: "でんきショック",   type: "でんき", cat: "spec", power: 40,  acc: 100, pp: 30, effect: { status: "par", chance: 10 } },
  sparktackle: { name: "スパークタックル", type: "でんき", cat: "phys", power: 65,  acc: 100, pp: 20, effect: { status: "par", chance: 30 } },
  lightning:   { name: "ライトニング",     type: "でんき", cat: "spec", power: 90,  acc: 100, pp: 15, effect: { status: "par", chance: 10 } },
  mahidenpa:   { name: "まひでんぱ",       type: "でんき", cat: "stat", power: 0,   acc: 90,  pp: 20, effect: { status: "par", chance: 100 } },
  // かくとう
  seikenzuki:  { name: "せいけんづき",     type: "かくとう", cat: "phys", power: 50,  acc: 100, pp: 25 },
  mawashigeri: { name: "まわしげり",       type: "かくとう", cat: "phys", power: 60,  acc: 90,  pp: 20, effect: { flinch: 10 } },
  bakuretsuken:{ name: "ばくれつけん",     type: "かくとう", cat: "phys", power: 100, acc: 80,  pp: 5 },
  toukon:      { name: "とうこんチャージ", type: "かくとう", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { atk: 1, def: 1 }, target: "self" } },
  // どく
  dokubari:    { name: "どくばり",         type: "どく", cat: "phys", power: 35,  acc: 100, pp: 35, effect: { status: "psn", chance: 30 } },
  hedoro:      { name: "ヘドロこうげき",   type: "どく", cat: "spec", power: 75,  acc: 100, pp: 15, effect: { status: "psn", chance: 30 } },
  // じめん
  dorokake:    { name: "どろかけ",         type: "じめん", cat: "spec", power: 30,  acc: 100, pp: 20, effect: { stages: { acc: -1 }, target: "foe" } },
  mudshot:     { name: "マッドショット",   type: "じめん", cat: "phys", power: 55,  acc: 95,  pp: 20 },
  earthcrash:  { name: "アースクラッシュ", type: "じめん", cat: "phys", power: 95,  acc: 100, pp: 10 },
  // ひこう
  kazeokoshi:  { name: "かぜおこし",       type: "ひこう", cat: "spec", power: 40,  acc: 100, pp: 30 },
  tsubasa:     { name: "つばさでうつ",     type: "ひこう", cat: "phys", power: 60,  acc: 100, pp: 25 },
  sonicwing:   { name: "ソニックウィング", type: "ひこう", cat: "spec", power: 75,  acc: 95,  pp: 15, effect: { flinch: 20 } },
  skydive:     { name: "スカイダイブ",     type: "ひこう", cat: "phys", power: 100, acc: 95,  pp: 10, effect: { recoil: 0.25 } },
  // エスパー
  nenriki:     { name: "ねんりき",         type: "エスパー", cat: "spec", power: 50,  acc: 100, pp: 25, effect: { flinch: 10 } },
  psychokinesis:{ name: "サイキネシス",    type: "エスパー", cat: "spec", power: 90,  acc: 100, pp: 10, effect: { stages: { spd: -1 }, target: "foe", chance: 10 } },
  meisou:      { name: "めいそう",         type: "エスパー", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { spa: 1, spd: 1 }, target: "self" } },
  nemurihadou: { name: "ねむりのはどう",   type: "エスパー", cat: "stat", power: 0,   acc: 70,  pp: 15, effect: { status: "slp", chance: 100 } },
  healinglight:{ name: "いやしのひかり",   type: "エスパー", cat: "stat", power: 0,   acc: null, pp: 10, effect: { heal: 0.5 } },
  // むし
  bugbite:     { name: "バグバイト",       type: "むし", cat: "phys", power: 60,  acc: 100, pp: 20 },
  mushinohikari:{ name: "ムシのひかり",    type: "むし", cat: "spec", power: 75,  acc: 100, pp: 15 },
  itowohaku:   { name: "いとをはく",       type: "むし", cat: "stat", power: 0,   acc: 95,  pp: 30, effect: { stages: { spe: -1 }, target: "foe" } },
  // いわ
  iwaotoshi:   { name: "いわおとし",       type: "いわ", cat: "phys", power: 50,  acc: 90,  pp: 25 },
  gansekinadare:{ name: "がんせきなだれ",  type: "いわ", cat: "phys", power: 75,  acc: 90,  pp: 10, effect: { flinch: 30 } },
  // ゴースト
  shadowdash:  { name: "シャドーダッシュ", type: "ゴースト", cat: "phys", power: 40,  acc: 100, pp: 25, effect: { priority: 1 } },
  shadowsphere:{ name: "シャドースフィア", type: "ゴースト", cat: "spec", power: 80,  acc: 100, pp: 15, effect: { stages: { spd: -1 }, target: "foe", chance: 20 } },
  noroibi:     { name: "のろいのひとだま", type: "ゴースト", cat: "spec", power: 60,  acc: 100, pp: 20, effect: { status: "brn", chance: 10 } },
  // ドラゴン
  dragobreath: { name: "ドラゴブレス",     type: "ドラゴン", cat: "spec", power: 60,  acc: 100, pp: 20, effect: { status: "par", chance: 30 } },
  ryunotsume:  { name: "りゅうのツメ",     type: "ドラゴン", cat: "phys", power: 80,  acc: 100, pp: 15 },
  ryumai:      { name: "りゅうのまい",     type: "ドラゴン", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { atk: 1, spe: 1 }, target: "self" } },
  dragonburst: { name: "ドラゴンバースト", type: "ドラゴン", cat: "spec", power: 110, acc: 90,  pp: 5 },
};

export function moveData(id) {
  const m = MOVES[id];
  if (!m) throw new Error("unknown move: " + id);
  return m;
}
