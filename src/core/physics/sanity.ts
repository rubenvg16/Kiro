/**
 * Headless self check of the physics core.
 *
 * Run it with:
 *   node --experimental-strip-types src/core/physics/sanity.ts
 *
 * The script exits with code 1 as soon as one check fails.
 */

import * as THREE from 'three';
import type { CharacterInput, CharacterState } from './CharacterController';

declare const process: { exitCode: number; exit(code: number): never };

type PhysicsWorldModule = typeof import('./PhysicsWorld');
type CharacterControllerModule = typeof import('./CharacterController');
type FollowCameraModule = typeof import('../../world/FollowCamera');

// The modules are loaded through runtime URLs because Node resolves TypeScript
// imports by their exact file name.
const worldModule = (await import(new URL('./PhysicsWorld.ts', import.meta.url).href)) as PhysicsWorldModule;
const characterModule = (await import(
  new URL('./CharacterController.ts', import.meta.url).href
)) as CharacterControllerModule;
const followCameraModule = (await import(
  new URL('../../world/FollowCamera.ts', import.meta.url).href
)) as FollowCameraModule;

const { PhysicsWorld } = worldModule;
const { CharacterController } = characterModule;
const { FollowCamera } = followCameraModule;

const FRAME = 1 / 60;
let failures = 0;

function report(name: string, ok: boolean, detail = ''): void {
  const suffix = detail.length > 0 ? ` - ${detail}` : '';
  if (ok) {
    console.log(`PASS  ${name}${suffix}`);
    return;
  }
  failures += 1;
  console.log(`FAIL  ${name}${suffix}`);
}

function input(overrides: Partial<CharacterInput> = {}): CharacterInput {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    jumpPressed: false,
    jumpHeld: false,
    sprint: false,
    ...overrides,
  };
}

function addFloor(world: InstanceType<typeof PhysicsWorld>, size = 20): void {
  world.addStaticBox(new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(size, 0.5, size));
}

/**
 * Runs the character and the world in the same order the game does: the
 * character moves first, then the world integrates the dynamic bodies with
 * the velocities the character just gave them.
 */
function runCharacterAndWorld(
  world: InstanceType<typeof PhysicsWorld>,
  controller: InstanceType<typeof CharacterController>,
  frames: number,
  inputForFrame: (frame: number) => CharacterInput,
  delta = FRAME,
  onFrame?: (frame: number) => void,
): void {
  for (let frame = 0; frame < frames; frame++) {
    controller.update(delta, inputForFrame(frame));
    world.step(delta);
    if (onFrame) onFrame(frame);
  }
}

function runCharacter(
  controller: InstanceType<typeof CharacterController>,
  seconds: number,
  inputForFrame: (frame: number) => CharacterInput,
  onFrame?: (state: CharacterState) => void,
): CharacterState {
  const frames = Math.round(seconds / FRAME);
  let state = controller.update(FRAME, inputForFrame(0));
  for (let frame = 1; frame <= frames; frame++) {
    state = controller.update(FRAME, inputForFrame(frame));
    if (onFrame) onFrame(state);
  }
  return state;
}

// -----------------------------------------------------------------------------
// 1. A dropped box comes to rest exactly on top of the floor.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'resting-box',
    shape: 'box',
    position: new THREE.Vector3(0, 5, 0),
    half: new THREE.Vector3(0.5, 0.5, 0.5),
    mass: 1,
  });

  for (let frame = 0; frame < 180; frame++) world.step(FRAME);

  report(
    'dropped box rests on the floor',
    Math.abs(body.position.y - 0.5) <= 0.02,
    `y=${body.position.y.toFixed(4)} expected=0.5`,
  );
  report(
    'resting box has no residual velocity',
    body.velocity.length() < 0.05,
    `speed=${body.velocity.length().toFixed(5)}`,
  );
}

// -----------------------------------------------------------------------------
// 2. A body with restitution bounces, but much lower than the drop height.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'bouncing-ball',
    shape: 'sphere',
    position: new THREE.Vector3(0, 5, 0),
    radius: 0.5,
    mass: 1,
    restitution: 0.5,
  });

  const dropHeight = body.position.y - 0.5;
  let impacted = false;
  let bounceApex = -Infinity;

  for (let frame = 0; frame < 300; frame++) {
    world.step(FRAME);
    if (!impacted) {
      if (body.position.y <= 0.55) impacted = true;
    } else if (body.velocity.y <= 0) {
      bounceApex = Math.max(bounceApex, body.position.y);
    }
  }

  const bounceHeight = bounceApex - 0.5;
  report(
    'body bounces after the first impact',
    impacted && bounceHeight > 0,
    `bounceHeight=${bounceHeight.toFixed(3)}`,
  );
  report(
    'bounce apex is at least 40% lower than the drop height',
    bounceHeight < dropHeight * 0.6,
    `bounce=${bounceHeight.toFixed(3)} drop=${dropHeight.toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 3. A dropped character lands, stays grounded and does not drift.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 3, 0));

  let landed = false;
  let landingSpeed = 0;
  let groundedFrames = 0;
  let airborneAfterLanding = 0;

  const state = runCharacter(controller, 3, () => input(), (sample) => {
    if (sample.justLanded) {
      landed = true;
      landingSpeed = sample.landingSpeed;
      groundedFrames += 1;
      return;
    }
    if (!landed) return;
    if (sample.grounded) groundedFrames += 1;
    else airborneAfterLanding += 1;
  });

  report('character lands on the floor', landed && landingSpeed > 3, `landingSpeed=${landingSpeed.toFixed(2)}`);
  report(
    'character stays grounded after landing',
    state.grounded && airborneAfterLanding === 0 && groundedFrames > 100,
    `groundedFrames=${groundedFrames} airborne=${airborneAfterLanding}`,
  );
  report(
    'character rests at floor level',
    Math.abs(state.position.y) <= 0.02,
    `y=${state.position.y.toFixed(4)}`,
  );
  report(
    'character does not drift horizontally',
    Math.abs(state.position.x) < 0.01 && Math.abs(state.position.z) < 0.01,
    `x=${state.position.x.toFixed(4)} z=${state.position.z.toFixed(4)}`,
  );
}

// -----------------------------------------------------------------------------
// 4. A character cannot walk through a wall and can slide along it.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  world.addStaticBox(new THREE.Vector3(2, 1.5, 0), new THREE.Vector3(0.5, 1.5, 6));

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 0.05, 0));

  const blocked = runCharacter(controller, 2.5, () => input({ moveX: 1 }));
  report(
    'character is stopped by the wall',
    blocked.position.x < 1.17 && blocked.position.x > 0.8,
    `x=${blocked.position.x.toFixed(3)} limit=1.15`,
  );

  const slid = runCharacter(controller, 1.5, () => input({ moveZ: 1 }));
  report(
    'character slides along the wall',
    slid.position.z < -1 && slid.position.x < 1.17,
    `x=${slid.position.x.toFixed(3)} z=${slid.position.z.toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 5. A character walks up a 0.4 m ledge without jumping.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  world.addStaticBox(new THREE.Vector3(4, 0.2, 0), new THREE.Vector3(2.5, 0.2, 3));

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0.5, 0, 0));

  let maxHeight = 0;
  const state = runCharacter(controller, 1.6, () => input({ moveX: 1 }), (sample) => {
    maxHeight = Math.max(maxHeight, sample.position.y);
  });

  report(
    'character steps up onto the ledge',
    state.position.y > 0.35 && state.position.y < 0.45,
    `y=${state.position.y.toFixed(3)}`,
  );
  report(
    'character climbs onto the ledge without jumping',
    maxHeight <= 0.46 && state.position.x > 1.6,
    `maxY=${maxHeight.toFixed(3)} x=${state.position.x.toFixed(3)}`,
  );
  report('character is grounded on the ledge', state.grounded, `grounded=${state.grounded}`);
}

// -----------------------------------------------------------------------------
// 6. A character jumps, leaves the ground and lands again.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 0.02, 0));

  const settled = runCharacter(controller, 0.5, () => input());

  let apex = settled.position.y;
  let leftGround = false;
  let landedAgain = false;
  const frames = Math.round(1.8 / FRAME);

  for (let frame = 0; frame < frames; frame++) {
    const held = frame < 42;
    const state = controller.update(FRAME, input({ jumpPressed: frame === 0, jumpHeld: held }));
    if (!state.grounded) leftGround = true;
    if (leftGround && state.grounded) landedAgain = true;
    apex = Math.max(apex, state.position.y);
  }

  report(
    'character jumps and lands again',
    settled.grounded && leftGround && landedAgain,
    `grounded=${settled.grounded} airborne=${leftGround} landed=${landedAgain}`,
  );
  report(
    'jump apex is in the expected band',
    apex >= 1.8 && apex <= 2.4,
    `apex=${apex.toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 7. A resting sphere does not jitter.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'resting-sphere',
    shape: 'sphere',
    position: new THREE.Vector3(0, 1, 0),
    radius: 0.5,
    mass: 1,
  });

  for (let frame = 0; frame < 120; frame++) world.step(FRAME);

  report(
    'resting sphere has near zero residual velocity',
    body.velocity.length() < 0.05,
    `speed=${body.velocity.length().toFixed(5)}`,
  );
  report(
    'resting sphere sits on the floor',
    Math.abs(body.position.y - 0.5) <= 0.02,
    `y=${body.position.y.toFixed(4)}`,
  );
}

// -----------------------------------------------------------------------------
// 8. Triggers report enter and exit without pushing the body.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  world.addStaticBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1), { isTrigger: true });

  let entered = 0;
  let exited = 0;
  world.onTriggerEnter = () => {
    entered += 1;
  };
  world.onTriggerExit = () => {
    exited += 1;
  };

  const body = world.addBody({
    id: 'trigger-probe',
    shape: 'sphere',
    position: new THREE.Vector3(0, 0, 0),
    radius: 0.3,
  });

  for (let frame = 0; frame < 30; frame++) world.step(FRAME);
  for (let frame = 0; frame < 60; frame++) {
    body.position.set(0, 12, 0);
    world.step(FRAME);
  }

  report('trigger enter and exit fire once', entered === 1 && exited === 1, `enter=${entered} exit=${exited}`);
  report('trigger does not push the body', body.position.y > 10, `y=${body.position.y.toFixed(3)}`);
}

// -----------------------------------------------------------------------------
// 9. Two identical runs produce identical results.
// -----------------------------------------------------------------------------
{
  const simulate = (): number => {
    const world = new PhysicsWorld();
    addFloor(world);
    const body = world.addBody({
      id: 'deterministic-sphere',
      shape: 'sphere',
      position: new THREE.Vector3(0.3, 4, 0.2),
      radius: 0.4,
      mass: 2,
    });
    for (let frame = 0; frame < 120; frame++) world.step(FRAME);
    return body.position.y;
  };

  const first = simulate();
  const second = simulate();
  report('simulation is deterministic', first === second, `y=${first} vs ${second}`);
}

// -----------------------------------------------------------------------------
// 10. The player only pushes what is in front of him.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);

  const beside = world.addBody({
    id: 'beside-ball',
    shape: 'sphere',
    position: new THREE.Vector3(0.4, 0.3, 1.3),
    radius: 0.3,
    mass: 1.2,
  });
  const inFront = world.addBody({
    id: 'front-ball',
    shape: 'sphere',
    position: new THREE.Vector3(2.2, 0.3, 0),
    radius: 0.3,
    mass: 1.2,
  });

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 0, 0));

  const besideStart = beside.position.clone();
  const frontStart = inFront.position.clone();
  let frontMaxSpeed = 0;

  runCharacterAndWorld(world, controller, 150, () => input({ moveX: 1 }), FRAME, () => {
    frontMaxSpeed = Math.max(frontMaxSpeed, inFront.velocity.length());
  });

  const besideDrift = beside.position.distanceTo(besideStart);
  const frontPush = inFront.position.x - frontStart.x;
  const frontSide = Math.abs(inFront.position.z - frontStart.z);

  report(
    'body beside the player is not shoved',
    besideDrift < 0.02,
    `drift=${besideDrift.toFixed(4)}`,
  );
  report(
    'body in front of the player is pushed away from him',
    frontPush > 0.15,
    `push=${frontPush.toFixed(3)}`,
  );
  report(
    'pushed body moves along the push direction only',
    frontSide < 0.05,
    `sideDrift=${frontSide.toFixed(4)}`,
  );
  report(
    'pushed body keeps a sane speed',
    frontMaxSpeed > 0.2 && frontMaxSpeed < 8,
    `maxSpeed=${frontMaxSpeed.toFixed(2)}`,
  );
}

// -----------------------------------------------------------------------------
// 11. The push is mass weighted and the player feels the momentum.
// -----------------------------------------------------------------------------
{
  const shove = (mass: number): { bodyTravel: number; charSpeed: number } => {
    const world = new PhysicsWorld();
    addFloor(world);
    const body = world.addBody({
      id: 'mass-probe',
      shape: 'sphere',
      position: new THREE.Vector3(1.6, 0.3, 0),
      radius: 0.3,
      mass,
    });
    const controller = new CharacterController(world);
    controller.teleport(new THREE.Vector3(-1.5, 0, 0));
    runCharacterAndWorld(world, controller, 180, () => input({ moveX: 1 }));
    return {
      bodyTravel: body.position.x - 1.6,
      charSpeed: controller.velocity.length(),
    };
  };

  const light = shove(1.2);
  const heavy = shove(30);

  report('light body is really pushed', light.bodyTravel > 0.2, `travel=${light.bodyTravel.toFixed(3)}`);
  report(
    'heavier body moves less than the lighter one',
    heavy.bodyTravel < light.bodyTravel * 0.6,
    `heavy=${heavy.bodyTravel.toFixed(3)} light=${light.bodyTravel.toFixed(3)}`,
  );
  report(
    'player slows down when shoving a heavy body',
    heavy.charSpeed < light.charSpeed * 0.8,
    `heavy=${heavy.charSpeed.toFixed(2)} light=${light.charSpeed.toFixed(2)}`,
  );
}

// -----------------------------------------------------------------------------
// 12. A respawn (teleport) never launches the bodies around it.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'respawn-ball',
    shape: 'sphere',
    position: new THREE.Vector3(0, 0.3, 0),
    radius: 0.3,
    mass: 1,
  });

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 0, 6));
  for (let frame = 0; frame < 90; frame++) world.step(FRAME);

  const speedBefore = body.velocity.length();
  // The respawn drops the player right on top of the ball.
  controller.teleport(new THREE.Vector3(0, 0, 0));

  let maxSpeed = 0;
  runCharacterAndWorld(world, controller, 60, () => input(), FRAME, () => {
    maxSpeed = Math.max(maxSpeed, body.velocity.length());
  });

  report(
    'respawn does not launch a nearby body',
    maxSpeed < 1.5 && speedBefore < 0.05,
    `maxSpeed=${maxSpeed.toFixed(3)} before=${speedBefore.toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 13. No motion is dropped and thin walls cannot be tunnelled through.
// -----------------------------------------------------------------------------
{
  // (a) A long fall keeps every millimetre of its displacement.
  const fallWorld = new PhysicsWorld({ gravity: 0 });
  const faller = new CharacterController(fallWorld);
  faller.teleport(new THREE.Vector3(0, 10, 0));
  faller.velocity.y = -30;
  faller.update(0.1, input());
  report(
    'long fall is not truncated',
    Math.abs(faller.position.y - 7) < 0.001,
    `y=${faller.position.y.toFixed(4)} expected=7`,
  );

  // (b) A 0.16 m thin wall cannot be tunnelled at high speed.
  const wallWorld = new PhysicsWorld();
  addFloor(wallWorld);
  wallWorld.addStaticBox(new THREE.Vector3(3, 2, 0), new THREE.Vector3(0.08, 2, 4));
  const runner = new CharacterController(wallWorld);
  runner.teleport(new THREE.Vector3(-2, 0, 0));
  for (let frame = 0; frame < 10; frame++) {
    runner.velocity.x = 30;
    runner.update(0.1, input());
  }
  report(
    'character does not tunnel through a 0.16 m wall',
    runner.position.x < 3 - 0.08 - 0.35,
    `x=${runner.position.x.toFixed(3)} limit=${(3 - 0.08 - 0.35).toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 14. A step up that cannot be completed leaves the character where it was.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  // A ledge of exactly one step height, with a tall block standing on it.
  world.addStaticBox(new THREE.Vector3(0.5, 0.225, 0), new THREE.Vector3(0.5, 0.225, 2));
  world.addStaticBox(new THREE.Vector3(0.3, 1.95, 0), new THREE.Vector3(0.3, 1.5, 2));

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(-1.5, 0, 0));
  const state = runCharacter(controller, 2, () => input({ moveX: 1 }));

  report(
    'failed step up leaves the character on the floor',
    Math.abs(state.position.y) < 0.02,
    `y=${state.position.y.toFixed(4)}`,
  );
  report(
    'failed step up does not cancel the jump',
    state.velocity.y <= 0.001,
    `vy=${state.velocity.y.toFixed(4)}`,
  );
}

// -----------------------------------------------------------------------------
// 15. A resting body sleeps and wakes up when the player touches it.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'sleep-ball',
    shape: 'sphere',
    position: new THREE.Vector3(0, 0.3, 0),
    radius: 0.3,
    mass: 1,
  });

  for (let frame = 0; frame < 120; frame++) world.step(FRAME);
  report('resting body falls asleep', body.sleeping, `sleeping=${body.sleeping}`);

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(-1.2, 0, 0));
  let woke = false;
  runCharacterAndWorld(world, controller, 120, () => input({ moveX: 1 }), FRAME, () => {
    if (!body.sleeping) woke = true;
  });

  report('touching a sleeping body wakes it up', woke, `sleeping=${body.sleeping}`);
  report(
    'woken body is pushed away from the player',
    body.position.x > 0.05,
    `x=${body.position.x.toFixed(3)}`,
  );
}

// -----------------------------------------------------------------------------
// 16. The physics time base follows the frame time (no slow motion).
// -----------------------------------------------------------------------------
{
  const fall = (delta: number, frames: number): number => {
    const world = new PhysicsWorld();
    const body = world.addBody({
      id: 'time-probe',
      shape: 'sphere',
      position: new THREE.Vector3(0, 50, 0),
      radius: 0.3,
      mass: 1,
    });
    for (let frame = 0; frame < frames; frame++) world.step(delta);
    return body.position.y;
  };

  const at60 = fall(1 / 60, 60);
  const at20 = fall(1 / 20, 20);
  report(
    '20 fps simulates the same time as 60 fps',
    Math.abs(at60 - at20) < 0.05,
    `y60=${at60.toFixed(4)} y20=${at20.toFixed(4)}`,
  );
}

// -----------------------------------------------------------------------------
// 17. The camera pull-in never leaves the camera inside a static.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  world.addStaticBox(new THREE.Vector3(0, 1.5, 1.5), new THREE.Vector3(2, 1.5, 0.5));

  const camera = new THREE.PerspectiveCamera(60, 1.77, 0.1, 100);
  const follow = new FollowCamera(camera);
  const target = new THREE.Vector3(0, 0, 0);
  for (let frame = 0; frame < 120; frame++) follow.followTarget(target, FRAME, world);

  const hits = world.overlapSphere(camera.position, 0.05);
  report(
    'camera is not inside a static after the pull in',
    hits.length === 0,
    `hits=${hits.length} pos=${camera.position.toArray().map((v) => v.toFixed(2)).join(',')}`,
  );

  // The ray of the obstruction test starts inside a solid: the camera has to
  // fall back to a usable position instead of staying inside the geometry.
  const blockedWorld = new PhysicsWorld();
  addFloor(blockedWorld);
  blockedWorld.addStaticBox(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.5, 1, 0.5));

  const blockedCamera = new THREE.PerspectiveCamera(60, 1.77, 0.1, 100);
  const blockedFollow = new FollowCamera(blockedCamera);
  for (let frame = 0; frame < 120; frame++) {
    blockedFollow.followTarget(new THREE.Vector3(0, 0, 0), FRAME, blockedWorld);
  }
  const blockedHits = blockedWorld.overlapSphere(blockedCamera.position, 0.05);
  report(
    'camera falls back to a valid position when the ray starts inside a wall',
    blockedHits.length === 0,
    `hits=${blockedHits.length} pos=${blockedCamera.position.toArray().map((v) => v.toFixed(2)).join(',')}`,
  );
}

// -----------------------------------------------------------------------------
// 18. A contact is reported again when the body lands a second time.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  let contacts = 0;
  world.onBodyContact = () => {
    contacts += 1;
  };
  world.addBody({
    id: 'bounce-ball',
    shape: 'sphere',
    position: new THREE.Vector3(0, 3, 0),
    radius: 0.3,
    mass: 1,
    restitution: 0.6,
  });

  for (let frame = 0; frame < 300; frame++) world.step(FRAME);
  report(
    'a new contact is reported after the body leaves and lands again',
    contacts >= 2,
    `contacts=${contacts}`,
  );
}

// -----------------------------------------------------------------------------
// 19. A body that rolls into the player bounces off him.
// -----------------------------------------------------------------------------
{
  const world = new PhysicsWorld();
  addFloor(world);
  const body = world.addBody({
    id: 'rolling-ball',
    shape: 'sphere',
    position: new THREE.Vector3(1.2, 0.3, 0),
    radius: 0.3,
    mass: 1,
    restitution: 0.5,
  });
  body.velocity.set(-6, 0, 0);

  const controller = new CharacterController(world);
  controller.teleport(new THREE.Vector3(0, 0, 0));

  let bounced = false;
  let peak = 0;
  for (let frame = 0; frame < 120; frame++) {
    controller.update(FRAME, input());
    world.step(FRAME);
    if (body.velocity.x > 0.5) bounced = true;
    peak = Math.max(peak, body.velocity.x);
  }

  report(
    'a body that rolls into the player bounces off',
    bounced,
    `peakVx=${peak.toFixed(3)}`,
  );
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll physics checks passed.');
