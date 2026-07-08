// 技データ
// cat: "phys"(物理) / "spec"(特殊) / "stat"(変化)
// effect:
//   status: "psn"|"par"|"brn"|"slp"  (chance % で相手に付与)
//   stages: { 対象ステータス: 段階 }  target: "self"|"foe"  (chance % で発動、省略時100)
//   drain: 与ダメの回復割合 / recoil: 与ダメの反動割合 / heal: 最大HPの回復割合
//   flinch: ひるみ確率% / priority: 優先度
export const MOVES = {
  // ノーマル
  taiatari:    { name: "たいあたり",       type: "ノーマル", cat: "phys", power: 40,  acc: 100, pp: 35,
    desc: "からだごと あいてに ぶつかって こうげきする。" },
  sharpclaw:   { name: "シャープクロー",   type: "ノーマル", cat: "phys", power: 70,  acc: 100, pp: 20,
    desc: "するどい ツメで あいてを きりさく。" },
  noshikakari: { name: "のしかかり",       type: "ノーマル", cat: "phys", power: 85,  acc: 100, pp: 15, effect: { status: "par", chance: 10 },
    desc: "たいじゅうを かけて のしかかる。まひさせることがある。" },
  zutsuki:     { name: "ずつき",           type: "ノーマル", cat: "phys", power: 70,  acc: 100, pp: 15, effect: { flinch: 30 },
    desc: "あたまから つっこむ。あいてを ひるませることがある。" },
  otakebi:     { name: "おたけび",         type: "ノーマル", cat: "spec", power: 90,  acc: 100, pp: 10,
    desc: "すさまじい さけびごえの しょうげきは で こうげきする。" },
  nakigoe:     { name: "なきごえ",         type: "ノーマル", cat: "stat", power: 0,   acc: 100, pp: 40, effect: { stages: { atk: -1 }, target: "foe" },
    desc: "かわいく ないて あいての こうげきを 1だんかい さげる。" },
  katakunaru:  { name: "かたくなる",       type: "ノーマル", cat: "stat", power: 0,   acc: null, pp: 30, effect: { stages: { def: 1 }, target: "self" },
    desc: "からだに ちからをこめて ぼうぎょを 1だんかい あげる。" },
  kiaitame:    { name: "きあいため",       type: "ノーマル", cat: "stat", power: 0,   acc: null, pp: 30, effect: { stages: { atk: 1 }, target: "self" },
    desc: "きあいを ためて こうげきを 1だんかい あげる。" },
  shippu:      { name: "しっぷうづき",     type: "ノーマル", cat: "phys", power: 40,  acc: 100, pp: 30, effect: { priority: 1 },
    desc: "めにもとまらぬ はやさで かならず せんせいこうげきできる。" },
  // ほのお
  hinoko:      { name: "ひのこ",           type: "ほのお", cat: "spec", power: 40,  acc: 100, pp: 25, effect: { status: "brn", chance: 10 },
    desc: "ちいさな ほのおを とばす。やけどさせることがある。" },
  kaenguruma:  { name: "かえんぐるま",     type: "ほのお", cat: "phys", power: 60,  acc: 100, pp: 25, effect: { status: "brn", chance: 10 },
    desc: "ほのおを まとって たいあたり。やけどさせることがある。" },
  flameburner: { name: "フレイムバーナー", type: "ほのお", cat: "spec", power: 90,  acc: 100, pp: 15, effect: { status: "brn", chance: 10 },
    desc: "ごうかな ほのおで やきつくす。やけどさせることがある。" },
  hifist:      { name: "ほのおのこぶし",   type: "ほのお", cat: "phys", power: 75,  acc: 100, pp: 15, effect: { status: "brn", chance: 10 },
    desc: "ほのおを まとった こぶしで なぐる。やけどさせることがある。" },
  onibi:       { name: "おにび",           type: "ほのお", cat: "stat", power: 0,   acc: 85,  pp: 15, effect: { status: "brn", chance: 100 },
    desc: "あやしい ひのたまで あいてを やけどにする。" },
  // みず
  mizudeppo:   { name: "みずでっぽう",     type: "みず", cat: "spec", power: 40,  acc: 100, pp: 25,
    desc: "みずを いきおいよく ふきだして こうげきする。" },
  bubblewave:  { name: "バブルウェーブ",   type: "みず", cat: "spec", power: 65,  acc: 100, pp: 20, effect: { stages: { spe: -1 }, target: "foe", chance: 10 },
    desc: "あわの なみで こうげき。すばやさを さげることがある。" },
  tidalwave:   { name: "タイダルウェーブ", type: "みず", cat: "spec", power: 90,  acc: 100, pp: 15,
    desc: "おおなみを まきおこして あいてを のみこむ。" },
  aquadash:    { name: "アクアダッシュ",   type: "みず", cat: "phys", power: 40,  acc: 100, pp: 20, effect: { priority: 1 },
    desc: "みずを まとった とっしん。かならず せんせいこうげきできる。" },
  // くさ
  tsurunomuchi:{ name: "つるのムチ",       type: "くさ", cat: "phys", power: 45,  acc: 100, pp: 25,
    desc: "しなやかな ツルで あいてを ムチのように たたく。" },
  leafcutter:  { name: "リーフカッター",   type: "くさ", cat: "phys", power: 55,  acc: 95,  pp: 25,
    desc: "するどい はっぱを とばして きりつける。" },
  leafdrain:   { name: "リーフドレイン",   type: "くさ", cat: "spec", power: 75,  acc: 100, pp: 10, effect: { drain: 0.5 },
    desc: "ようぶんを すいとる。あたえたダメージの はんぶん かいふく。" },
  greenburst:  { name: "グリーンバースト", type: "くさ", cat: "spec", power: 90,  acc: 100, pp: 10,
    desc: "しぜんの エネルギーを あつめて いっきに はなつ。" },
  nemurigona:  { name: "ねむりごな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 15, effect: { status: "slp", chance: 100 },
    desc: "ねむりを さそう こなを まきちらして ねむらせる。" },
  dokunokona:  { name: "どくのこな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 20, effect: { status: "psn", chance: 100 },
    desc: "どくの こなを あびせて あいてを どくにする。" },
  shibiregona: { name: "しびれごな",       type: "くさ", cat: "stat", power: 0,   acc: 75,  pp: 20, effect: { status: "par", chance: 100 },
    desc: "しびれる こなを あびせて あいてを まひさせる。" },
  // でんき
  denkishock:  { name: "でんきショック",   type: "でんき", cat: "spec", power: 40,  acc: 100, pp: 30, effect: { status: "par", chance: 10 },
    desc: "でんきの しげきで こうげき。まひさせることがある。" },
  sparktackle: { name: "スパークタックル", type: "でんき", cat: "phys", power: 65,  acc: 100, pp: 20, effect: { status: "par", chance: 30 },
    desc: "でんきを まとって とっしん。まひさせることがある。" },
  lightning:   { name: "ライトニング",     type: "でんき", cat: "spec", power: 90,  acc: 100, pp: 15, effect: { status: "par", chance: 10 },
    desc: "つよい いなずまを おとす。まひさせることがある。" },
  mahidenpa:   { name: "まひでんぱ",       type: "でんき", cat: "stat", power: 0,   acc: 90,  pp: 20, effect: { status: "par", chance: 100 },
    desc: "よわい でんぱを ながして あいてを まひさせる。" },
  // かくとう
  seikenzuki:  { name: "せいけんづき",     type: "かくとう", cat: "phys", power: 50,  acc: 100, pp: 25,
    desc: "きたえた こぶしで まっすぐに つく。" },
  mawashigeri: { name: "まわしげり",       type: "かくとう", cat: "phys", power: 60,  acc: 90,  pp: 20, effect: { flinch: 10 },
    desc: "いきおいよく けりつける。ひるませることがある。" },
  bakuretsuken:{ name: "ばくれつけん",     type: "かくとう", cat: "phys", power: 100, acc: 80,  pp: 5,
    desc: "こんしんの ちからを こめた ひっさつの こぶし。" },
  toukon:      { name: "とうこんチャージ", type: "かくとう", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { atk: 1, def: 1 }, target: "self" },
    desc: "とうこんを もやして こうげきと ぼうぎょを あげる。" },
  // どく
  dokubari:    { name: "どくばり",         type: "どく", cat: "phys", power: 35,  acc: 100, pp: 35, effect: { status: "psn", chance: 30 },
    desc: "どくの ハリを つきさす。どくにすることがある。" },
  hedoro:      { name: "ヘドロこうげき",   type: "どく", cat: "spec", power: 75,  acc: 100, pp: 15, effect: { status: "psn", chance: 30 },
    desc: "ヘドロを なげつける。どくにすることがある。" },
  // じめん
  dorokake:    { name: "どろかけ",         type: "じめん", cat: "spec", power: 30,  acc: 100, pp: 20, effect: { stages: { acc: -1 }, target: "foe" },
    desc: "どろを かけて こうげき。あいての めいちゅうを さげる。" },
  mudshot:     { name: "マッドショット",   type: "じめん", cat: "phys", power: 55,  acc: 95,  pp: 20,
    desc: "どろの かたまりを いきおいよく はっしゃする。" },
  earthcrash:  { name: "アースクラッシュ", type: "じめん", cat: "phys", power: 95,  acc: 100, pp: 10,
    desc: "だいちを ゆるがす いちげきを たたきこむ。" },
  // ひこう
  kazeokoshi:  { name: "かぜおこし",       type: "ひこう", cat: "spec", power: 40,  acc: 100, pp: 30,
    desc: "はばたいて おこした かぜで こうげきする。" },
  tsubasa:     { name: "つばさでうつ",     type: "ひこう", cat: "phys", power: 60,  acc: 100, pp: 25,
    desc: "つばさを おおきく ひろげて あいてを うつ。" },
  sonicwing:   { name: "ソニックウィング", type: "ひこう", cat: "spec", power: 75,  acc: 95,  pp: 15, effect: { flinch: 20 },
    desc: "おんそくの かまいたち。ひるませることがある。" },
  skydive:     { name: "スカイダイブ",     type: "ひこう", cat: "phys", power: 100, acc: 95,  pp: 10, effect: { recoil: 0.25 },
    desc: "じょうくうから きゅうこうか! じぶんも はんどうダメージ。" },
  // エスパー
  nenriki:     { name: "ねんりき",         type: "エスパー", cat: "spec", power: 50,  acc: 100, pp: 25, effect: { flinch: 10 },
    desc: "よわい ねんどうりょくで こうげき。ひるませることがある。" },
  psychokinesis:{ name: "サイキネシス",    type: "エスパー", cat: "spec", power: 90,  acc: 100, pp: 10, effect: { stages: { spd: -1 }, target: "foe", chance: 10 },
    desc: "つよい ねんどうりょく。とくぼうを さげることがある。" },
  meisou:      { name: "めいそう",         type: "エスパー", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { spa: 1, spd: 1 }, target: "self" },
    desc: "こころを しずめて とくこうと とくぼうを あげる。" },
  nemurihadou: { name: "ねむりのはどう",   type: "エスパー", cat: "stat", power: 0,   acc: 70,  pp: 15, effect: { status: "slp", chance: 100 },
    desc: "ねむけを さそう はどうで あいてを ねむらせる。" },
  healinglight:{ name: "いやしのひかり",   type: "エスパー", cat: "stat", power: 0,   acc: null, pp: 10, effect: { heal: 0.5 },
    desc: "やさしい ひかりで じぶんの HPを はんぶん かいふくする。" },
  // むし
  bugbite:     { name: "バグバイト",       type: "むし", cat: "phys", power: 60,  acc: 100, pp: 20,
    desc: "ちいさな あごで おもいきり かみつく。" },
  mushinohikari:{ name: "ムシのひかり",    type: "むし", cat: "spec", power: 75,  acc: 100, pp: 15,
    desc: "ふしぎな ひかりの ビームを はなつ。" },
  itowohaku:   { name: "いとをはく",       type: "むし", cat: "stat", power: 0,   acc: 95,  pp: 30, effect: { stages: { spe: -1 }, target: "foe" },
    desc: "ねばる いとを はきかけて あいての すばやさを さげる。" },
  // いわ
  iwaotoshi:   { name: "いわおとし",       type: "いわ", cat: "phys", power: 50,  acc: 90,  pp: 25,
    desc: "ちいさな いわを なげつけて こうげきする。" },
  gansekinadare:{ name: "がんせきなだれ",  type: "いわ", cat: "phys", power: 75,  acc: 90,  pp: 10, effect: { flinch: 30 },
    desc: "おおきな いわを ふらせる。ひるませることがある。" },
  // ゴースト
  shadowdash:  { name: "シャドーダッシュ", type: "ゴースト", cat: "phys", power: 40,  acc: 100, pp: 25, effect: { priority: 1 },
    desc: "かげを かけぬけて かならず せんせいこうげきできる。" },
  shadowsphere:{ name: "シャドースフィア", type: "ゴースト", cat: "spec", power: 80,  acc: 100, pp: 15, effect: { stages: { spd: -1 }, target: "foe", chance: 20 },
    desc: "かげの たまを はなつ。とくぼうを さげることがある。" },
  noroibi:     { name: "のろいのひとだま", type: "ゴースト", cat: "spec", power: 60,  acc: 100, pp: 20, effect: { status: "brn", chance: 10 },
    desc: "あやしい ひとだまを とばす。やけどさせることがある。" },
  // ドラゴン
  dragobreath: { name: "ドラゴブレス",     type: "ドラゴン", cat: "spec", power: 60,  acc: 100, pp: 20, effect: { status: "par", chance: 30 },
    desc: "りゅうの いぶきを はきつける。まひさせることがある。" },
  ryunotsume:  { name: "りゅうのツメ",     type: "ドラゴン", cat: "phys", power: 80,  acc: 100, pp: 15,
    desc: "するどい りゅうの ツメで あいてを きりさく。" },
  ryumai:      { name: "りゅうのまい",     type: "ドラゴン", cat: "stat", power: 0,   acc: null, pp: 20, effect: { stages: { atk: 1, spe: 1 }, target: "self" },
    desc: "しんぴの まいで こうげきと すばやさを あげる。" },
  dragonburst: { name: "ドラゴンバースト", type: "ドラゴン", cat: "spec", power: 110, acc: 90,  pp: 5,
    desc: "りゅうの ちからを ばくはつさせる さいきょうの いちげき。" },
};

export function moveData(id) {
  const m = MOVES[id];
  if (!m) throw new Error("unknown move: " + id);
  return m;
}

// UI用: 技の情報を1行にまとめる (威力・命中・説明)
const CAT_LABEL = { phys: "ぶつり", spec: "とくしゅ", stat: "へんか" };
export function moveInfo(id) {
  const m = moveData(id);
  const power = m.power > 0 ? m.power : "—";
  const acc = m.acc === null ? "—" : m.acc;
  return `いりょく${power} めいちゅう${acc} ${CAT_LABEL[m.cat]}\n${m.desc}`;
}
