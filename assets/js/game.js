import {
  Player,
  PatrolNPC,
  SprintPickup,
  SlowPickup,
  JumpPickup,
  drawEntity,
  drawPickup,
  Vec2,
  distanceSquared,
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

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  obstacles: [
    { x: 220, y: 60, width: 140, height: 180 },
    { x: 90, y: 240, width: 90, height: 180 },
    { x: 420, y: 80, width: 160, height: 110 },
    { x: 420, y: 260, width: 180, height: 70 },
    { x: 640, y: 120, width: 220, height: 60 },
    { x: 660, y: 260, width: 80, height: 180 },
  ],
};

const playerSpawn = new Vec2(120, 120);

const PICKUP_POSITIONS = [
  { create: () => new SprintPickup(new Vec2(300, 160)) },
  { create: () => new SlowPickup(new Vec2(650, 190)) },
  { create: () => new JumpPickup(new Vec2(520, 380)) },
];

const NPC_CONFIGS = [
  {
    name: 'Wächter Alpha',
    path: [
      new Vec2(720, 140),
      new Vec2(860, 140),
      new Vec2(860, 260),
      new Vec2(720, 260),
    ],
    speed: 120,
  },
  {
    name: 'Wächter Beta',
    path: [
      new Vec2(240, 360),
      new Vec2(240, 460),
      new Vec2(440, 460),
      new Vec2(440, 360),
    ],
    speed: 115,
  },
];

const input = {
  up: 0,
  down: 0,
  left: 0,
  right: 0,
  shift: false,
};

let player;
let pickups = [];
let npcs = [];
let lastTimestamp = 0;
let running = false;
let tutorialMode = false;
let animationFrameId = null;
let lastNpcToastTime = 0;

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
  player = new Player(playerSpawn);
  pickups = PICKUP_POSITIONS.map((factory) => factory.create());
  npcs = NPC_CONFIGS.map((config) => {
    const path = config.path.map((point) => point.clone());
    const start = path[0].clone();
    return new PatrolNPC(start, {
      path,
      speed: tutorialMode ? 0 : config.speed,
      name: config.name,
    });
  });
}

function resetInput() {
  input.up = 0;
  input.down = 0;
  input.left = 0;
  input.right = 0;
  input.shift = false;
}

function startGame() {
  resetInput();
  setupWorld();
  menu.classList.add('hidden');
  canvas.classList.remove('hidden');
  hud.classList.remove('hidden');
  toastContainer.innerHTML = '';
  running = true;
  lastTimestamp = performance.now();
  lastNpcToastTime = 0;
  animationFrameId = requestAnimationFrame(loop);
  showToast(tutorialMode ? 'Lehrmodus aktiv.' : 'Viel Glück im Labyrinth!');
}

function showMenu() {
  running = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
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

function loop(timestamp) {
  if (!running) {
    return;
  }

  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  update(delta);
  render();
  updateHud();

  animationFrameId = requestAnimationFrame(loop);
}

function update(dt) {
  if (!player) {
    return;
  }
  player.update(input, dt, WORLD);
  npcs.forEach((npc) => npc.update(dt, WORLD));
  resolvePickups();
  resolveNpcCollisions();
}

function resolvePickups() {
  if (!player) {
    return;
  }

  pickups.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    const sum = player.radius + pickup.radius;
    if (distanceSquared(player.position, pickup.position) <= sum * sum) {
      pickup.collect();
      player.applyEffect(pickup.type);
      showToast(effectToMessage(pickup.type));
    }
  });
}

function resolveNpcCollisions() {
  if (!player) {
    return;
  }

  const now = performance.now();
  npcs.forEach((npc) => {
    if (npc.collisionCooldown > 0) {
      return;
    }
    const radius = player.radius + npc.radius;
    if (distanceSquared(player.position, npc.position) <= radius * radius) {
      npc.handleCollision();
      player.moveToSafePosition();
      player.slowTimer = Math.max(player.slowTimer, 1.5);
      if (now - lastNpcToastTime > 1500) {
        showToast(`${npc.name} blockiert den Weg!`);
        lastNpcToastTime = now;
      }
    }
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawArena();
  pickups.forEach((pickup) => drawPickup(ctx, pickup));
  if (player) {
    drawEntity(ctx, player);
  }
  npcs.forEach((npc) => drawEntity(ctx, npc));
}

function drawArena() {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(10, 15, 40, 0.95)');
  gradient.addColorStop(1, 'rgba(2, 6, 18, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
  WORLD.obstacles.forEach((rect) => {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  });

  ctx.restore();
}

function updateHud() {
  if (!player) {
    return;
  }
  let speedLabel = 'Normal';
  if (player.slowTimer > 0) {
    speedLabel = 'Verlangsamt';
  } else if (player.sprintTimer > 0) {
    speedLabel = input.shift ? 'Sprint' : 'Bereit';
  }
  speedStatus.textContent = `Geschwindigkeit: ${speedLabel}`;

  const hasJump = player.jumpEffectTimer > 0;
  const ready = hasJump && !player.isJumping && player.jumpCooldown === 0;
  let jumpLabel = 'Nein';
  if (hasJump) {
    jumpLabel = ready ? 'Ja' : 'Lädt';
  }
  jumpStatus.textContent = `Sprung bereit: ${jumpLabel}`;
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

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
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

setupMenu();
showMenu();
