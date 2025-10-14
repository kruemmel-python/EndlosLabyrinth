import planck from 'https://cdn.skypack.dev/planck-js@0.3.0';
import {
  Player,
  PatrolNPC,
  SprintPickup,
  SlowPickup,
  JumpPickup,
  drawEntity,
  drawPickup,
  Vec2,
  SCALE,
} from './entities.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const speedStatus = document.getElementById('speed-status');
const jumpStatus = document.getElementById('jump-status');
const toastTemplate = document.getElementById('toast-template');
const menuInfo = document.getElementById('menu-info');
const tutorialInfo = document.getElementById('tutorial-info');
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

const input = {
  up: 0,
  down: 0,
  left: 0,
  right: 0,
  shift: false,
};

let world;
let player;
let pickups = [];
let npcs = [];
let accumulator = 0;
let lastTimestamp = 0;
let running = false;
let tutorialMode = false;
let animationFrameId = null;

function setupMenu() {
  document.getElementById('start-game').addEventListener('click', () => {
    tutorialMode = false;
    startGame();
  });
  document.getElementById('options').addEventListener('click', () => {
    toggleInfo(menuInfo, tutorialInfo);
  });
  document.getElementById('tutorial').addEventListener('click', () => {
    tutorialMode = true;
    startGame();
  });

  document.querySelectorAll('.close-info').forEach((button) => {
    button.addEventListener('click', () => {
      menuInfo.hidden = true;
      tutorialInfo.hidden = true;
    });
  });
}

function toggleInfo(target, other) {
  if (target.hidden) {
    target.hidden = false;
    other.hidden = true;
  } else {
    target.hidden = true;
  }
}

function setupWorld() {
  world = new planck.World(Vec2(0, 0));
  player = new Player(world, Vec2(4, 4));
  pickups = [
    new SprintPickup(world, Vec2(7, 3)),
    new SlowPickup(world, Vec2(14, 6)),
    new JumpPickup(world, Vec2(9, 10)),
  ];

  npcs = [
    new PatrolNPC(world, {
      position: Vec2(12, 4),
      path: [Vec2(12, 4), Vec2(18, 4), Vec2(18, 8), Vec2(12, 8)],
      speed: tutorialMode ? 0 : 2.5,
      name: 'Wächter Alpha',
    }),
    new PatrolNPC(world, {
      position: Vec2(6, 11),
      path: [Vec2(6, 11), Vec2(6, 15), Vec2(10, 15), Vec2(10, 11)],
      speed: tutorialMode ? 0 : 2.2,
      name: 'Wächter Beta',
    }),
  ];

  createBoundaries();
  setupCollisionHandling();
}

function createBoundaries() {
  const width = canvas.width / SCALE;
  const height = canvas.height / SCALE;
  const ground = world.createBody();
  ground.createFixture(planck.Edge(Vec2(0, 0), Vec2(width, 0)));
  ground.createFixture(planck.Edge(Vec2(0, 0), Vec2(0, height)));
  ground.createFixture(planck.Edge(Vec2(width, 0), Vec2(width, height)));
  ground.createFixture(planck.Edge(Vec2(0, height), Vec2(width, height)));

  const obstacles = [
    { min: Vec2(8, 2), max: Vec2(10, 6) },
    { min: Vec2(3, 8), max: Vec2(5, 12) },
    { min: Vec2(13, 9), max: Vec2(16, 11) },
  ];

  obstacles.forEach(({ min, max }) => {
    const body = world.createBody();
    body.createFixture(planck.Box((max.x - min.x) / 2, (max.y - min.y) / 2, Vec2((min.x + max.x) / 2, (min.y + max.y) / 2)));
    body.setUserData({ type: 'wall' });
  });
}

function setupCollisionHandling() {
  world.on('begin-contact', (contact) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const dataA = fixtureA.getBody().getUserData();
    const dataB = fixtureB.getBody().getUserData();

    resolveContact(dataA, dataB);
    resolveContact(dataB, dataA);
  });
}

function resolveContact(primary, secondary) {
  if (!primary) return;
  if (primary.type === 'player' && secondary?.type === 'pickup') {
    const pickup = secondary.entity;
    if (!pickup || pickup.collected) return;
    pickup.collect();
    player.applyEffect(secondary.effect);
    showToast(effectToMessage(secondary.effect));
    pickups = pickups.filter((item) => !item.collected);
  }
  if (primary.type === 'npc') {
    primary.entity?.handleCollision(secondary?.entity);
  }
}

function effectToMessage(effect) {
  switch (effect) {
    case 'sprint':
      return 'Sprint aktiviert! Halte Umschalt zum Beschleunigen.';
    case 'slow':
      return 'Verlangsamer getroffen! Tempo reduziert.';
    case 'jump':
      return 'Sprungfähigkeit freigeschaltet – drücke Leertaste!';
    default:
      return 'Unbekannte Energie aufgenommen.';
  }
}

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function startGame() {
  Object.assign(input, { up: 0, down: 0, left: 0, right: 0, shift: false });
  setupWorld();
  menu.classList.add('hidden');
  canvas.classList.remove('hidden');
  hud.classList.remove('hidden');
  running = true;
  accumulator = 0;
  lastTimestamp = performance.now();
  animationFrameId = requestAnimationFrame(loop);
  showToast(tutorialMode ? 'Lehrmodus aktiv.' : 'Viel Glück im Labyrinth!');
}

function showMenu() {
  running = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  world = null;
  player = null;
  pickups = [];
  npcs = [];
  toastContainer.innerHTML = '';
  speedStatus.textContent = 'Geschwindigkeit: Normal';
  jumpStatus.textContent = 'Sprung bereit: Nein';
  menu.classList.remove('hidden');
  canvas.classList.add('hidden');
  hud.classList.add('hidden');
}

function handleKey(event, isDown) {
  const value = isDown ? 1 : 0;
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      input.up = value;
      break;
    case 'ArrowDown':
    case 'KeyS':
      input.down = value;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      input.left = value;
      break;
    case 'ArrowRight':
    case 'KeyD':
      input.right = value;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      input.shift = isDown;
      break;
    case 'Space':
      if (isDown && player?.tryJump()) {
        showToast('Sprung ausgeführt!');
      }
      break;
    default:
      break;
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && running) {
    showMenu();
    showToast('Zurück im Hauptmenü.');
    return;
  }
  handleKey(event, true);
});
window.addEventListener('keyup', (event) => {
  handleKey(event, false);
});

function loop(timestamp) {
  if (!running) return;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  accumulator += delta;
  const timeStep = 1 / 60;

  while (accumulator >= timeStep) {
    player.update(input, timeStep);
    npcs.forEach((npc) => npc.update(timeStep));
    world.step(timeStep, 8, 3);
    accumulator -= timeStep;
  }

  render();
  updateHud();
  animationFrameId = requestAnimationFrame(loop);
}

function updateHud() {
  if (!player) return;
  let speedLabel = 'Normal';
  if (player.slowTimer > 0) {
    speedLabel = 'Verlangsamt';
  } else if (player.sprintTimer > 0) {
    speedLabel = input.shift ? 'Sprint' : 'Bereit';
  }
  speedStatus.textContent = `Geschwindigkeit: ${speedLabel}`;
  const jumpReady = player.jumpEffectTimer > 0 && player.jumpCooldown === 0;
  const jumpLabel = player.jumpEffectTimer > 0 ? (jumpReady ? 'Ja' : 'Lädt') : 'Nein';
  jumpStatus.textContent = `Sprung bereit: ${jumpLabel}`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawArena();
  pickups.forEach((pickup) => drawPickup(ctx, pickup));
  drawEntity(ctx, player);
  npcs.forEach((npc) => drawEntity(ctx, npc));
}

function drawArena() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.fillRect(240, 60, 120, 180);
  ctx.fillRect(90, 240, 90, 180);
  ctx.fillRect(390, 270, 180, 60);
  ctx.restore();
}

setupMenu();
showMenu();
