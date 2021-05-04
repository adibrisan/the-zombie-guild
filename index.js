import * as PIXI from "pixi.js";
import Player from "./player.js";
import Zombie from "./zombie.js";
import Spawner from "./spawner.js";
import { zombies, textStyle, subTextStyle } from "./globals.js";
import GameState from "./game-state.js";
import Weather from "./weather.js";
//import Matter from "matter-js";

const canvasSize = 350;
const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: canvasSize,
  height: canvasSize,
  backgroundColor: 0x312a2b,
  resolution: 2
});

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; //make player more pixelated
//Music
const music = new Audio("./assets/HordeZee.mp3");
music.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});
//zombie sounds
const zombieHorde = new Audio("./assets/horde.mp3");
zombieHorde.volume = 0.5;
zombieHorde.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});

initGame();

async function initGame() {
  let keys = {};
  let keysDiv;

  app.gameState = GameState.PREINTRO;
  try {
    console.log("loading...");
    await loadAssets();
    console.log("loaded");
    app.weather = new Weather({ app });

    keysDiv = document.querySelector("#keys");

    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);

    function keysDown(e) {
      keys[e.keyCode] = true;
    }
    function keysUp(e) {
      keys[e.keyCode] = false;
    }

    let player = new Player({ app });

    function gameLoop() {
      keysDiv.innerHTML = JSON.stringify(keys);
      // W
      if (keys["87"]) {
        player.position.y -= 0.001;
      }
      // A
      if (keys["65"]) {
        player.position.x -= 0.001;
      }
      // S
      if (keys["83"]) {
        player.position.y += 0.001;
      }
      // D
      if (keys["68"]) {
        player.position.x += 0.001;
      }
    }

    let zSpawner = new Spawner({
      app,
      create: () => new Zombie({ app, player })
    });
    //making square look after our cursor

    let gamePreIntroScene = createScene(
      "The zombie guild",
      "Click to Continue"
    );
    let gameStartScene = createScene("The zombie guild", "Click to Start");
    let gameOverScene = createScene("The zombie guild", "Game Over");

    app.ticker.add((delta) => {
      if (player.dead) app.gameState = GameState.GAMEOVER;

      gamePreIntroScene.visible = app.gameState === GameState.PREINTRO;
      gameStartScene.visible = app.gameState === GameState.START;
      gameOverScene.visible = app.gameState === GameState.GAMEOVER;

      switch (app.gameState) {
        case GameState.PREINTRO:
          player.scale = 4;
          break;
        case GameState.INTRO:
          player.scale -= 0.01;
          if (player.scale <= 1) app.gameState = GameState.START;
          break;
        case GameState.RUNNING:
          app.ticker.add(gameLoop);
          player.update(delta);
          zSpawner.spawns.forEach((zombie) => zombie.update(delta));
          bulletHitTest({
            bullets: player.shooting.bullets,
            zombies: zSpawner.spawns,
            bulletRadius: 8,
            zombieRadius: 16
          });
          break;

        default:
          break;
      }
    });
  } catch (error) {
    console.log(error.message);
    console.log("Load failed");
  }
}

function bulletHitTest({ bullets, zombies, bulletRadius, zombieRadius }) {
  bullets.forEach((bullet) => {
    zombies.forEach((zombie, index) => {
      let dx = zombie.position.x - bullet.position.x;
      let dy = zombie.position.y - bullet.position.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bulletRadius + zombieRadius) {
        zombies.splice(index, 1);
        zombie.kill();
      }
    });
  });
}

function createScene(sceneText, sceneSubText) {
  const sceneContainer = new PIXI.Container();
  const text = new PIXI.Text(sceneText, new PIXI.TextStyle(textStyle));
  text.x = app.screen.width / 2;
  text.y = 0;
  text.anchor.set(0.5, 0);

  const subText = new PIXI.Text(sceneSubText, new PIXI.TextStyle(subTextStyle));
  subText.x = app.screen.width / 2;
  subText.y = 50;
  subText.anchor.set(0.5, 0);

  sceneContainer.zIndex = 1;
  sceneContainer.addChild(text);
  sceneContainer.addChild(subText);
  app.stage.addChild(sceneContainer);
  return sceneContainer;
}

async function loadAssets() {
  return new Promise((resolve, reject) => {
    zombies.forEach((z) => PIXI.Loader.shared.add(`assets/${z}.json`));
    PIXI.Loader.shared.add("assets/hero_male.json");
    PIXI.Loader.shared.add("bullet", "assets/bullet.png");
    PIXI.Loader.shared.add("rain", "assets/rain.png");
    PIXI.Loader.shared.onComplete.add(resolve);
    PIXI.Loader.shared.onError.add(reject);
    PIXI.Loader.shared.load();
  });
}

function clickHandler() {
  switch (app.gameState) {
    case GameState.PREINTRO:
      app.gameState = GameState.INTRO;
      music.play();
      app.weather.enableSound();
      break;
    case GameState.START:
      app.gameState = GameState.RUNNING;
      zombieHorde.play();
      break;
    default:
      break;
  }
}

document.addEventListener("click", clickHandler);
