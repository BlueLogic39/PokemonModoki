// セーブ・ロード (localStorage)
const KEY = "tomoshibi_save_v1";

export function saveGame(player) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ver: 1, at: Date.now(), player }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.player || null;
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(KEY);
}

export function deleteSave() {
  localStorage.removeItem(KEY);
}
