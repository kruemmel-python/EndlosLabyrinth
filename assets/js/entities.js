const TWO_PI = Math.PI * 2;

export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  subtract(other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  add(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  scale(factor) {
    return new Vec2(this.x * factor, this.y * factor);
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) {
      return new Vec2(0, 0);
    }
    return new Vec2(this.x / len, this.y / len);
  }
}

export class Player {
  constructor(position) {
    this.position = position.clone();
    this.spawn = position.clone();
    this.lastSafePosition = position.clone();
    this.radius = 18;

    this.baseSpeed = 180;
    this.sprintTimer = 0;
    this.slowTimer = 0;
    this.jumpEffectTimer = 0;
    this.jumpCooldown = 0;
    this.jumpTimer = 0;
    this.jumpDuration = 0;
    this.jumpHeight = 0;
    this.isJumping = false;
    this.speedState = 'normal';
  }

  applyEffect(effect) {
    switch (effect) {
      case 'sprint':
        this.sprintTimer = Math.max(this.sprintTimer, 6);
        break;
      case 'slow':
        this.slowTimer = Math.max(this.slowTimer, 4);
        break;
      case 'jump':
        this.jumpEffectTimer = Math.max(this.jumpEffectTimer, 10);
        break;
      default:
        break;
    }
  }

  tryJump() {
    if (this.jumpEffectTimer <= 0 || this.jumpCooldown > 0 || this.isJumping) {
      return false;
    }
    this.isJumping = true;
    this.jumpTimer = 0.45;
    this.jumpDuration = this.jumpTimer;
    this.jumpCooldown = 1.1;
    return true;
  }

  update(input, dt, world) {
    this.updateEffects(dt);

    const direction = new Vec2(input.right - input.left, input.down - input.up);
    let velocity = new Vec2(0, 0);
    if (direction.x !== 0 || direction.y !== 0) {
      velocity = direction.normalize();
    }

    let speed = this.baseSpeed;
    if (this.slowTimer > 0) {
      speed *= 0.55;
      this.speedState = 'slow';
    } else if (this.sprintTimer > 0 && input.shift) {
      speed *= 1.7;
      this.speedState = 'sprint';
    } else if (this.sprintTimer > 0) {
      this.speedState = 'bereit';
    } else {
      this.speedState = 'normal';
    }

    const delta = velocity.scale(speed * dt);
    moveWithCollisions(this, delta.x, delta.y, world, this.isJumping);

    if (!this.isJumping && !collidesWithWorld(this.position.x, this.position.y, this.radius, world, false)) {
      this.lastSafePosition = this.position.clone();
    }
  }

  updateEffects(dt) {
    if (this.sprintTimer > 0) {
      this.sprintTimer = Math.max(0, this.sprintTimer - dt);
    }
    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
    }
    if (this.jumpEffectTimer > 0) {
      this.jumpEffectTimer = Math.max(0, this.jumpEffectTimer - dt);
    }
    if (this.jumpCooldown > 0) {
      this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    }
    if (this.isJumping) {
      this.jumpTimer = Math.max(0, this.jumpTimer - dt);
      const progress = this.jumpDuration === 0 ? 1 : 1 - this.jumpTimer / this.jumpDuration;
      this.jumpHeight = Math.sin(progress * Math.PI) * 22;
      if (this.jumpTimer === 0) {
        this.isJumping = false;
        this.jumpHeight = 0;
      }
    } else {
      this.jumpHeight = 0;
    }
  }

  resetToSpawn() {
    this.position = this.spawn.clone();
    this.lastSafePosition = this.spawn.clone();
  }

  moveToSafePosition() {
    this.position = this.lastSafePosition.clone();
  }
}

export class Pickup {
  constructor(position, options) {
    const { type, label, color } = options;
    this.position = position.clone();
    this.type = type;
    this.label = label;
    this.color = color;
    this.radius = 14;
    this.collected = false;
  }

  collect() {
    this.collected = true;
  }
}

export class SprintPickup extends Pickup {
  constructor(position) {
    super(position, { type: 'sprint', label: 'Sprint', color: '#3dd68c' });
  }
}

export class SlowPickup extends Pickup {
  constructor(position) {
    super(position, { type: 'slow', label: 'Slow', color: '#ff6b6b' });
  }
}

export class JumpPickup extends Pickup {
  constructor(position) {
    super(position, { type: 'jump', label: 'Sprung', color: '#8ab6ff' });
  }
}

export class PatrolNPC {
  constructor(position, options = {}) {
    const { path = [], speed = 110, name = 'Wächter' } = options;
    this.position = position.clone();
    this.path = path.map((point) => point.clone());
    this.speed = speed;
    this.name = name;
    this.radius = 18;
    this.currentIndex = 0;
    this.direction = 1;
    this.collisionCooldown = 0;
  }

  update(dt, world) {
    if (this.speed === 0 || this.path.length === 0) {
      return;
    }

    if (this.collisionCooldown > 0) {
      this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    }

    const target = this.path[this.currentIndex];
    const toTarget = target.subtract(this.position);
    const distance = toTarget.length();

    if (distance < 4) {
      this.currentIndex = (this.currentIndex + this.direction + this.path.length) % this.path.length;
      return;
    }

    const step = toTarget.normalize().scale(this.speed * dt);
    moveWithCollisions(this, step.x, step.y, world, false);
  }

  handleCollision() {
    this.direction *= -1;
    this.currentIndex = (this.currentIndex + this.direction + this.path.length) % this.path.length;
    this.collisionCooldown = 0.6;
  }
}

export function moveWithCollisions(entity, deltaX, deltaY, world, ignoreSolids) {
  moveAxis(entity, deltaX, 'x', world, ignoreSolids);
  moveAxis(entity, deltaY, 'y', world, ignoreSolids);
}

function moveAxis(entity, delta, axis, world, ignoreSolids) {
  if (delta === 0) {
    return;
  }

  const stepSize = entity.radius * 0.5;
  let remaining = delta;

  while (Math.abs(remaining) > 0) {
    const step = Math.abs(remaining) > stepSize ? stepSize * Math.sign(remaining) : remaining;
    const nextX = axis === 'x' ? entity.position.x + step : entity.position.x;
    const nextY = axis === 'y' ? entity.position.y + step : entity.position.y;

    if (collidesWithWorld(nextX, nextY, entity.radius, world, ignoreSolids)) {
      return;
    }

    entity.position.x = nextX;
    entity.position.y = nextY;
    remaining -= step;
  }
}

export function collidesWithWorld(x, y, radius, world, ignoreSolids) {
  if (x - radius < 0 || x + radius > world.width) {
    return true;
  }
  if (y - radius < 0 || y + radius > world.height) {
    return true;
  }
  if (ignoreSolids) {
    return false;
  }
  return world.obstacles.some((rect) => circleIntersectsRect(x, y, radius, rect));
}

function circleIntersectsRect(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function drawEntity(ctx, entity) {
  ctx.save();
  ctx.translate(entity.position.x, entity.position.y);

  if (entity instanceof Player) {
    ctx.fillStyle = '#64ffda';
    ctx.beginPath();
    ctx.arc(0, -entity.jumpHeight, entity.radius, 0, TWO_PI);
    ctx.fill();

    if (entity.isJumping) {
      ctx.strokeStyle = 'rgba(100, 255, 218, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius * 0.8, 0, TWO_PI);
      ctx.stroke();
    }
  } else if (entity instanceof PatrolNPC) {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(0, 0, entity.radius, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = '#200714';
    ctx.fillRect(-entity.radius * 0.6, -entity.radius * 0.5, entity.radius * 1.2, entity.radius * 0.3);
    ctx.fillRect(-entity.radius * 0.6, entity.radius * 0.2, entity.radius * 1.2, entity.radius * 0.3);
  }

  ctx.restore();
}

export function drawPickup(ctx, pickup) {
  if (!pickup || pickup.collected) {
    return;
  }
  ctx.save();
  ctx.translate(pickup.position.x, pickup.position.y);
  ctx.fillStyle = pickup.color;
  ctx.beginPath();
  ctx.arc(0, 0, pickup.radius, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = '#050914';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pickup.label[0], 0, 0);
  ctx.restore();
}
