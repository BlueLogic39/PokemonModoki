// アイテムデータ
// effect: heal(HP回復量), cure(状態異常回復), revive(ひんし回復割合), ball(捕獲倍率)
export const ITEMS = {
  ball1:    { name: "キャプボール",     price: 200,  desc: "やせいの モンスターを つかまえる ボール。", effect: { ball: 1 } },
  ball2:    { name: "シルバーボール",   price: 600,  desc: "キャプボールより つかまえやすい ぎんいろの ボール。", effect: { ball: 1.5 } },
  ball3:    { name: "ゴールドボール",   price: 1200, desc: "かなり つかまえやすい きんいろの ボール。", effect: { ball: 2 } },
  ballX:    { name: "ミラクルボール",   price: 0,    desc: "どんな モンスターも かならず つかまえられる きせきの ボール。", effect: { ball: 255 } },
  potion1:  { name: "キズぐすり",       price: 300,  desc: "モンスターの HPを 20 かいふくする。", effect: { heal: 20 } },
  potion2:  { name: "いいキズぐすり",   price: 700,  desc: "モンスターの HPを 60 かいふくする。", effect: { heal: 60 } },
  potion3:  { name: "すごいキズぐすり", price: 1500, desc: "モンスターの HPを 120 かいふくする。", effect: { heal: 120 } },
  fullheal: { name: "まんたんのくすり", price: 3000, desc: "モンスターの HPを ぜんぶ かいふくする。", effect: { heal: 9999 } },
  antidote: { name: "どくけし",         price: 200,  desc: "どく状態を なおす。", effect: { cure: ["psn"] } },
  parheal:  { name: "まひなおし",       price: 200,  desc: "まひ状態を なおす。", effect: { cure: ["par"] } },
  burnheal: { name: "やけどなおし",     price: 250,  desc: "やけど状態を なおす。", effect: { cure: ["brn"] } },
  awake:    { name: "ねむけざまし",     price: 250,  desc: "ねむり状態を なおす。", effect: { cure: ["slp"] } },
  fullcure: { name: "なんでもなおし",   price: 600,  desc: "すべての 状態異常を なおす。", effect: { cure: ["psn", "par", "brn", "slp"] } },
  revive:   { name: "げんきのかけら",   price: 1500, desc: "ひんしの モンスターを HPはんぶんで ふっかつさせる。", effect: { revive: 0.5 } },
};

export function itemData(id) {
  const it = ITEMS[id];
  if (!it) throw new Error("unknown item: " + id);
  return it;
}
