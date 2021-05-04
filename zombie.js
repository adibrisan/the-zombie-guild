import * as PIXI from "pixi.js";
import Victor from "victor";
import { zombies } from "./globals";

export default class Zombie {
  constructor({ app, player }) {
    this.app = app;
    this.player = player;

    this.speed = 1;
    let r = this.randomSpawnPoint();

    let zombieName = zombies[Math.floor(Math.random() * zombies.length)]; //gets random zombie from our array of zombies
    this.speed = zombieName === "quickzee" ? 1 : 0.25;
    let sheet =
      PIXI.Loader.shared.resources[`assets/${zombieName}.json`].spritesheet;

    this.die = new PIXI.AnimatedSprite(sheet.animations["die"]);
    this.attack = new PIXI.AnimatedSprite(sheet.animations["attack"]);
    this.zombie = new PIXI.AnimatedSprite(sheet.animations["walk"]);
    this.zombie.animationSpeed = zombieName === "quickzee" ? 0.2 : 0.1;
    this.zombie.play();
    this.zombie.anchor.set(0.5);

    this.zombie.position.set(r.x, r.y);

    app.stage.addChild(this.zombie);
    this.audio = new Audio("./assets/squelch.mp3");
  }

  attackPlayer() {
    if (this.attacking) return;
    this.attacking = true;
    this.interval = setInterval(() => this.player.attack(), 500);
    this.zombie.textures = this.attack.textures;
    this.zombie.animationSpeed = 0.1;
    this.zombie.play();
  }

  update(delta) {
    let e = new Victor(this.zombie.position.x, this.zombie.position.y);
    let s = new Victor(this.player.position.x, this.player.position.y); //vector for our player
    if (e.distance(s) < this.player.width / 2) {
      this.attackPlayer();
      return;
    }
    let d = s.subtract(e); //zombie trebuie sa ajunga la player deci calculam dist
    let v = d.normalize().multiplyScalar(this.speed * delta); //velocity vector
    this.zombie.scale.x = v.x < 0 ? 1 : -1;
    this.zombie.position.set(
      this.zombie.position.x + v.x,
      this.zombie.position.y + v.y
    );
  }

  kill() {
    //this.app.stage.removeChild(this.zombie);
    this.audio.currentTime = 0;
    this.audio.play();
    this.zombie.textures = this.die.textures;
    this.zombie.loop = false;
    this.zombie.onComplete = () =>
      setTimeout(() => this.app.stage.removeChild(this.zombie), 8000);
    this.zombie.play();
    this.zombie.zIndex = -1;
    clearInterval(this.interval);
  }

  get position() {
    return this.zombie.position;
  }

  randomSpawnPoint() {
    let edge = Math.floor(Math.random() * 4); //random 0-3
    let spawnPoint = new Victor(0, 0);
    let canvasSize = this.app.screen.width;
    switch (edge) {
      case 0: //top
        spawnPoint.x = canvasSize * Math.random(); //canvas e marimea unei imagini vizibile
        break;
      case 1: //right
        spawnPoint.x = canvasSize;
        spawnPoint.y = canvasSize * Math.random();
        break;
      case 2: //bottom
        spawnPoint.x = canvasSize * Math.random();
        spawnPoint.y = canvasSize;
        break;
      default:
        //left
        spawnPoint.x = 0;
        spawnPoint.y = canvasSize * Math.random();
        break;
    }
    return spawnPoint;
  }
}
