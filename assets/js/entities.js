import planck from 'https://cdn.skypack.dev/planck-js@0.3.0';

export const Vec2 = planck.Vec2;

export class Player {
  constructor(world, position = Vec2(0, 0)) {
    this.world = world;
    this.baseSpeed = 7;
    this.currentSpeedState = 'normal';
    this.jumpEffectTimer = 0;
    this.jumpCooldown = 0;
    this.isJumping = false;
    this.jumpVisualTimer = 0;
    this.jumpSensorTimer = 0;
    this.jumpHeight = 0;
    this.sprintTimer = 0;
    this.slowTimer = 0;

    this.body = world.createBody({
      type: 'dynamic',
      position,
      linearDamping: 8,
      fixedRotation: true,
    });
    this.fixture = this.body.createFixture(planck.Circle(0.6), {
      density: 1,
      friction: 0.2,
      userData: { type: 'player' },
    });
    this.body.setUserData({ type: 'player', entity: this });
  }

  get position() {
    return this.body.getPosition();
  }

  applyEffect(effect) {
    switch (effect) {
      case 'sprint':
        this.sprintTimer = Math.max(this.sprintTimer || 0, 6);
        this.currentSpeedState = 'sprint';
        break;
      case 'slow':
        this.slowTimer = Math.max(this.slowTimer || 0, 4);
        this.currentSpeedState = 'slow';
        break;
      case 'jump':
        this.jumpEffectTimer = Math.max(this.jumpEffectTimer, 10);
        break;
      default:
        break;
    }
  }

  updateEffects(dt) {
    if (this.sprintTimer) {
      this.sprintTimer -= dt;
      if (this.sprintTimer <= 0) {
        this.sprintTimer = 0;
        this.currentSpeedState = this.slowTimer > 0 ? 'slow' : 'normal';
      }
    }
    if (this.slowTimer) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.currentSpeedState = this.sprintTimer > 0 ? 'sprint' : 'normal';
      }
    }
    if (this.jumpEffectTimer > 0) {
      this.jumpEffectTimer = Math.max(0, this.jumpEffectTimer - dt);
    }
    if (this.jumpCooldown > 0) {
      this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    }
    if (this.jumpVisualTimer > 0) {
      this.jumpVisualTimer = Math.max(0, this.jumpVisualTimer - dt);
      this.jumpHeight = Math.sin((1 - this.jumpVisualTimer / 0.5) * Math.PI) * 12;
      if (this.jumpVisualTimer === 0) {
        this.jumpHeight = 0;
        this.isJumping = false;
      }
    }
    if (this.jumpSensorTimer > 0) {
      this.jumpSensorTimer = Math.max(0, this.jumpSensorTimer - dt);
      if (this.jumpSensorTimer === 0) {
        this.fixture.setSensor(false);
      }
    }
  }

  handleMovement(input, dt) {
    const desired = Vec2(
      (input.right - input.left),
      (input.down - input.up)
    );

    if (desired.lengthSquared() > 0) {
      desired.normalize();
    }

    let speed = this.baseSpeed;
    if (this.slowTimer > 0) {
      speed *= 0.55;
    }
    if (this.sprintTimer > 0 && input.shift) {
      speed *= 1.8;
      this.currentSpeedState = 'sprint';
    } else if (this.slowTimer > 0) {
      this.currentSpeedState = 'slow';
    } else {
      this.currentSpeedState = 'normal';
    }
    const velocity = desired.mul(speed);
    this.body.setLinearVelocity(velocity);
  }

  tryJump() {
    if (this.jumpEffectTimer <= 0 || this.jumpCooldown > 0 || this.isJumping) {
      return false;
    }
    this.isJumping = true;
    this.jumpCooldown = 1.2;
    this.jumpVisualTimer = 0.5;
    this.jumpSensorTimer = 0.45;
    this.fixture.setSensor(true);

    const forward = this.body.getLinearVelocity();
    const impulse = forward.lengthSquared() > 0.01 ? forward.mul(1.8) : Vec2(0, -5);
    this.body.applyLinearImpulse(impulse, this.body.getWorldCenter(), true);
    return true;
  }

  update(input, dt) {
    this.handleMovement(input, dt);
    this.updateEffects(dt);
  }
}

export class Pickup {
  constructor(world, position, radius = 0.5, options = {}) {
    const { type = 'pickup', label = 'pickup', color = '#fff' } = options;
    this.world = world;
    this.type = type;
    this.label = label;
    this.color = color;
    this.collected = false;

    this.body = world.createBody({
      type: 'static',
      position,
    });
    this.fixture = this.body.createFixture(planck.Circle(radius), {
      isSensor: true,
      userData: { type: 'pickup', effect: this.type },
    });
    this.body.setUserData({ type: 'pickup', effect: this.type, entity: this });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.world.destroyBody(this.body);
    this.body = null;
  }
}

export class SprintPickup extends Pickup {
  constructor(world, position) {
    super(world, position, 0.6, {
      type: 'sprint',
      label: 'Sprint',
      color: '#45ffb6',
    });
  }
}

export class SlowPickup extends Pickup {
  constructor(world, position) {
    super(world, position, 0.6, {
      type: 'slow',
      label: 'Verlangsamer',
      color: '#ff5f1f',
    });
  }
}

export class JumpPickup extends Pickup {
  constructor(world, position) {
    super(world, position, 0.6, {
      type: 'jump',
      label: 'Sprung',
      color: '#8ab6ff',
    });
  }
}

export class PatrolNPC {
  constructor(world, options = {}) {
    const {
      position = Vec2(0, 0),
      path = [Vec2(0, 0), Vec2(4, 0)],
      speed = 3,
      size = 0.8,
      name = 'Wächter',
    } = options;

    this.world = world;
    this.path = path;
    this.speed = speed;
    this.currentIndex = 0;
    this.name = name;

    this.body = world.createBody({
      type: 'dynamic',
      position,
      linearDamping: 6,
      fixedRotation: true,
    });
    this.body.createFixture(planck.Circle(size), {
      density: 1,
      friction: 0.3,
      userData: { type: 'npc' },
    });
    this.body.setUserData({ type: 'npc', entity: this });
  }

  update(dt) {
    if (this.path.length === 0) return;
    const target = this.path[this.currentIndex];
    const position = this.body.getPosition();
    const toTarget = Vec2(target.x - position.x, target.y - position.y);
    const distance = toTarget.length();

    if (distance < 0.2) {
      this.currentIndex = (this.currentIndex + 1) % this.path.length;
    } else {
      const desired = toTarget.mul(1 / Math.max(distance, 0.0001));
      const velocity = desired.mul(this.speed);
      this.body.setLinearVelocity(velocity);
    }
  }

  handleCollision(other) {
    if (!other) return;
    const velocity = this.body.getLinearVelocity();
    const bounce = velocity.mul(-0.6);
    this.body.setLinearVelocity(bounce);
  }
}

export function drawEntity(ctx, entity) {
  if (!entity || !entity.body) return;
  const position = entity.body.getPosition();
  const angle = entity.body.getAngle();
  ctx.save();
  ctx.translate(position.x * SCALE, position.y * SCALE);
  ctx.rotate(angle);

  if (entity instanceof Player) {
    ctx.fillStyle = '#64ffda';
    const radius = 20;
    ctx.beginPath();
    ctx.arc(0, -entity.jumpHeight, radius, 0, Math.PI * 2);
    ctx.fill();
    if (entity.jumpHeight > 1) {
      ctx.strokeStyle = 'rgba(100, 255, 218, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (entity instanceof PatrolNPC) {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(-12, -10, 24, 5);
    ctx.fillRect(-12, 5, 24, 5);
  }

  ctx.restore();
}

export function drawPickup(ctx, pickup) {
  if (!pickup || pickup.collected || !pickup.body) return;
  const position = pickup.body.getPosition();
  ctx.save();
  ctx.translate(position.x * SCALE, position.y * SCALE);
  ctx.fillStyle = pickup.color || '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#050914';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pickup.label[0] || '?', 0, 0);
  ctx.restore();
}

export const SCALE = 30;
