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

// The modules are loaded through runtime URLs because Node resolves TypeScript
// imports by their exact file name.
const worldModule = (await import(new URL('./PhysicsWorld.ts', import.meta.url).href)) as PhysicsWorldModule;
const characterModule = (await import(
  new URL('./CharacterController.ts', import.meta.url).href
)) as CharacterControllerModule;

const { PhysicsWorld } = worldModule;
const { CharacterController } = characterModule;

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

if (failures > 0) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll physics checks passed.');
