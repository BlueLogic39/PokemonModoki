import { startGame } from "./game.js";
import { TitleScene } from "./scenes/title.js";

const canvas = document.getElementById("screen");
startGame(canvas, new TitleScene());
